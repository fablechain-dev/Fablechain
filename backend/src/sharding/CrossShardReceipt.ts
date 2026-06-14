```typescript
import { createHash } from 'crypto';
import { EventEmitter } from 'events';
import * as assert from 'assert';

interface CrossShardReceiptData {
  receiptHash: string;
  sourceShardId: number;
  destinationShardId: number;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  status: ReceiptStatus;
  gasUsed: bigint;
  contractAddress?: string;
  logs: ReceiptLog[];
  merkleProof: string[];
  merkleRoot: string;
}

interface ReceiptLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

enum ReceiptStatus {
  PENDING = 'PENDING',
  COMMITTED = 'COMMITTED',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
}

interface MerkleTreeNode {
  hash: string;
  left?: MerkleTreeNode;
  right?: MerkleTreeNode;
  data?: string;
}

interface CrossShardReceiptConfig {
  maxReceiptsPerBatch: number;
  merkleTreeDepth: number;
  verificationTimeout: number;
  retryAttempts: number;
}

export class CrossShardReceipt extends EventEmitter {
  private receipts: Map<string, CrossShardReceiptData> = new Map();
  private merkleRoots: Map<number, Map<string, string>> = new Map();
  private verificationCache: Map<string, boolean> = new Map();
  private shardCommitments: Map<number, Map<string, string>> = new Map();
  private config: CrossShardReceiptConfig;

  constructor(config: Partial<CrossShardReceiptConfig> = {}) {
    super();
    this.config = {
      maxReceiptsPerBatch: config.maxReceiptsPerBatch ?? 1000,
      merkleTreeDepth: config.merkleTreeDepth ?? 20,
      verificationTimeout: config.verificationTimeout ?? 300000,
      retryAttempts: config.retryAttempts ?? 3,
    };
    this.initializeShardMaps();
  }

  private initializeShardMaps(): void {
    for (let i = 0; i < 256; i++) {
      this.merkleRoots.set(i, new Map());
      this.shardCommitments.set(i, new Map());
    }
  }

  public createReceipt(data: {
    sourceShardId: number;
    destinationShardId: number;
    transactionHash: string;
    blockNumber: number;
    timestamp: number;
    gasUsed: bigint;
    status: ReceiptStatus;
    contractAddress?: string;
    logs?: ReceiptLog[];
  }): CrossShardReceiptData {
    assert(
      data.sourceShardId >= 0 && data.sourceShardId < 256,
      'Invalid source shard ID'
    );
    assert(
      data.destinationShardId >= 0 && data.destinationShardId < 256,
      'Invalid destination shard ID'
    );
    assert(data.gasUsed >= 0n, 'Gas used must be non-negative');
    assert(data.timestamp > 0, 'Invalid timestamp');

    const receiptData: CrossShardReceiptData = {
      receiptHash: '',
      sourceShardId: data.sourceShardId,
      destinationShardId: data.destinationShardId,
      transactionHash: data.transactionHash,
      blockNumber: data.blockNumber,
      timestamp: data.timestamp,
      status: data.status,
      gasUsed: data.gasUsed,
      contractAddress: data.contractAddress,
      logs: data.logs || [],
      merkleProof: [],
      merkleRoot: '',
    };

    receiptData.receiptHash = this.hashReceiptData(receiptData);
    this.receipts.set(receiptData.receiptHash, receiptData);

    this.emit('receipt:created', {
      hash: receiptData.receiptHash,
      sourceShardId: data.sourceShardId,
      destinationShardId: data.destinationShardId,
      timestamp: data.timestamp,
    });

    return receiptData;
  }

  public commitReceipt(
    receiptHash: string,
    shardId: number
  ): { commitment: string; success: boolean } {
    const receipt = this.receipts.get(receiptHash);
    assert(receipt, `Receipt not found: ${receiptHash}`);
    assert(
      receipt.sourceShardId === shardId,
      'Receipt source shard mismatch'
    );
    assert(
      receipt.status !== ReceiptStatus.COMMITTED,
      'Receipt already committed'
    );

    receipt.status = ReceiptStatus.COMMITTED;
    const commitment = this.generateCommitment(receipt);

    const shardCommitments = this.shardCommitments.get(shardId);
    if (shardCommitments) {
      shardCommitments.set(receiptHash, commitment);
    }

    this.emit('receipt:committed', {
      hash: receiptHash,
      shardId,
      commitment,
      blockNumber: receipt.blockNumber,
    });

    return { commitment, success: true };
  }

  public buildMerkleProof(
    receiptHash: string,
    receiptsInBlock: string[]
  ): { proof: string[]; root: string } {
    const receipt = this.receipts.get(receiptHash);
    assert(receipt, `Receipt not found: ${receiptHash}`);
    assert(
      receipt.status === ReceiptStatus.COMMITTED,
      'Receipt must be committed before building proof'
    );

    const leaves = receiptsInBlock.map((hash) => this.hashString(hash));
    const tree = this.buildMerkleTree(leaves);
    const proof = this.extractMerkleProof(receiptHash, receiptsInBlock, tree);
    const root = tree.hash;

    receipt.merkleProof = proof;
    receipt.merkleRoot = root;

    const shardMerkleRoots = this.merkleRoots.get(receipt.sourceShardId);
    if (shardMerkleRoots) {
      shardMerkleRoots.set(receiptHash, root);
    }

    this.emit('merkle:proof:built', {
      receiptHash,
      shardId: receipt.sourceShardId,
      proofLength: proof.length,
      root,
    });

    return { proof, root };
  }

  public verifyMerkleProof(receipt: CrossShardReceiptData): boolean {
    const cacheKey = `${receipt.receiptHash}:${receipt.merkleRoot}`;
    if (this.verificationCache.has(cacheKey)) {
      return this.verificationCache.get(cacheKey) ?? false;
    }

    assert(
      receipt.merkleProof.length > 0,
      'Merkle proof is empty'
    );
    assert(receipt.merkleRoot.length > 0, 'Merkle root is empty');

    const receiptLeaf = this.hashString(receipt.receiptHash);
    let computedHash = receiptLeaf;

    for (const proofHash of receipt.merkleProof) {
      computedHash = this.hashCombined(computedHash, proofHash);
    }

    const isValid = computedHash === receipt.merkleRoot;

    this.verificationCache.set(cacheKey, isValid);

    if (isValid) {
      receipt.status = ReceiptStatus.VERIFIED;
      this.emit('receipt:verified', {
        receiptHash: receipt.receiptHash,
        destinationShardId: receipt.destinationShardId,
        timestamp: Date.now(),
      });
    } else {
      this.emit('receipt:verification:failed', {
        receiptHash: receipt.receiptHash