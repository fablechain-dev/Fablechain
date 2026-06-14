```typescript
import { EventEmitter } from 'events';
import crypto from 'crypto';
import { createHash } from 'crypto';

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: bigint;
  nonce: number;
  gasPrice: bigint;
  gasLimit: number;
  data: string;
  signature: string;
  timestamp: number;
}

export interface BlockHeader {
  version: number;
  previousHash: string;
  merkleRoot: string;
  timestamp: number;
  difficulty: number;
  nonce: number;
  miner: string;
  height: number;
  gasUsed: number;
  gasLimit: number;
  stateRoot: string;
}

export interface Block {
  header: BlockHeader;
  transactions: Transaction[];
  signature: string;
}

export interface MempoolConfig {
  maxSize: number;
  minGasPrice: bigint;
  txExpireTime: number;
}

export interface BlockBuilderConfig {
  maxTransactionsPerBlock: number;
  maxBlockSize: number;
  miner: string;
  privateKey: string;
  difficulty: number;
  gasLimit: number;
  mempoolConfig: MempoolConfig;
}

export class BlockBuilder extends EventEmitter {
  private mempool: Map<string, Transaction> = new Map();
  private config: BlockBuilderConfig;
  private lastBlockHash: string = '0'.repeat(64);
  private blockHeight: number = 0;
  private stateRoot: string = '0'.repeat(64);
  private gasUsedTracker: number = 0;

  constructor(config: BlockBuilderConfig) {
    super();
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.miner || this.config.miner.length === 0) {
      throw new Error('Invalid miner address');
    }
    if (!this.config.privateKey || this.config.privateKey.length < 32) {
      throw new Error('Invalid private key');
    }
    if (this.config.maxTransactionsPerBlock < 1) {
      throw new Error('Max transactions per block must be at least 1');
    }
    if (this.config.maxBlockSize < 1000) {
      throw new Error('Max block size must be at least 1000 bytes');
    }
  }

  public addTransaction(tx: Transaction): boolean {
    if (!this.validateTransaction(tx)) {
      this.emit('error', `Invalid transaction: ${tx.id}`);
      return false;
    }

    if (this.mempool.size >= this.config.mempoolConfig.maxSize) {
      const lowestGasPriceTx = this.findLowestGasPriceTx();
      if (lowestGasPriceTx && lowestGasPriceTx.gasPrice < tx.gasPrice) {
        this.mempool.delete(lowestGasPriceTx.id);
      } else {
        return false;
      }
    }

    this.mempool.set(tx.id, tx);
    this.emit('transactionAdded', tx.id);
    return true;
  }

  public removeTransaction(txId: string): boolean {
    return this.mempool.delete(txId);
  }

  public getMempoolSize(): number {
    return this.mempool.size;
  }

  public getMempool(): Transaction[] {
    return Array.from(this.mempool.values());
  }

  public async buildBlock(): Promise<Block> {
    const timestamp = Math.floor(Date.now() / 1000);
    const selectedTxs = this.selectTransactions();
    const merkleRoot = this.computeMerkleRoot(selectedTxs);
    this.gasUsedTracker = this.calculateGasUsed(selectedTxs);

    const header: BlockHeader = {
      version: 1,
      previousHash: this.lastBlockHash,
      merkleRoot,
      timestamp,
      difficulty: this.config.difficulty,
      nonce: 0,
      miner: this.config.miner,
      height: this.blockHeight,
      gasUsed: this.gasUsedTracker,
      gasLimit: this.config.gasLimit,
      stateRoot: this.stateRoot,
    };

    const block: Block = {
      header,
      transactions: selectedTxs,
      signature: '',
    };

    block.signature = this.signBlock(block);
    return block;
  }

  private validateTransaction(tx: Transaction): boolean {
    if (!tx.id || tx.id.length === 0) {
      return false;
    }

    if (!tx.from || !tx.to || tx.from.length === 0 || tx.to.length === 0) {
      return false;
    }

    if (tx.amount <= 0n) {
      return false;
    }

    if (tx.gasPrice < this.config.mempoolConfig.minGasPrice) {
      return false;
    }

    if (tx.gasLimit < 21000 || tx.gasLimit > this.config.gasLimit) {
      return false;
    }

    if (!this.verifyTransactionSignature(tx)) {
      return false;
    }

    const age = Math.floor(Date.now() / 1000) - tx.timestamp;
    if (age > this.config.mempoolConfig.txExpireTime) {
      return false;
    }

    return true;
  }

  private verifyTransactionSignature(tx: Transaction): boolean {
    try {
      const txData = `${tx.from}${tx.to}${tx.amount}${tx.nonce}${tx.gasPrice}${tx.gasLimit}${tx.data}${tx.timestamp}`;
      const hash = createHash('sha256').update(txData).digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(tx.signature, 'hex'),
        Buffer.from(hash.slice(0, 64), 'hex')
      );
    } catch {
      return false;
    }
  }

  private selectTransactions(): Transaction[] {
    const selectedTxs: Transaction[] = [];
    let blockSize = this.getBlockHeaderSize();
    let gasUsed = 0;

    const sortedTxs = Array.from(this.mempool.values()).sort((a, b) => {
      const feeA = Number(a.gasPrice) * a.gasLimit;
      const feeB = Number(b.gasPrice) * b.gasLimit;
      return feeB - feeA;
    });

    for (const tx of sortedTxs) {
      const txSize = this.estimateTransactionSize(tx);
      const txGasUsed = tx.gasLimit;

      if (
        selectedTxs.length < this.config.maxTransactionsPerBlock &&
        blockSize + txSize <= this.config.maxBlockSize &&
        gasUsed + txGasUsed <= this.config.gasLimit
      ) {
        selectedTxs.push(tx);
        blockSize += txSize;
        gasUsed += txGasUsed;
      }

      if (selectedTxs.length >= this.config.maxTransactionsPerBlock) {
        break;
      }
    }

    return selectedTxs;
  }

  private computeMerkleRoot(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return createHash('sha256').update('').digest('hex');
    }

    const hashes = transactions.map((tx) => this.hashTransaction(tx));
    return this.buildMerkleTree(hashes);
  }

  private hashTransaction(tx: Transaction): string {
    const txData = `${tx.id}${tx.from}${tx.to}${tx.amount}${tx.nonce}${tx.gasPrice}${tx.gasLimit}${tx.data}${tx.signature}${tx.timestamp}`;
    return createHash('sha256').update(txData).digest('hex');
  }

  private buildMerkleTree