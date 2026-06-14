```typescript
import { Block } from './Block';
import { Transaction } from './Transaction';
import { MerkleTree } from '../crypto/MerkleTree';
import { ProofOfIntelligence } from './ProofOfIntelligence';
import { Logger } from '../utils/Logger';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface BlockValidationConfig {
  maxBlockSize: number;
  maxTransactions: number;
  maxTimestampDrift: number;
  minDifficulty: number;
  poiVerificationThreshold: number;
}

export class BlockValidator {
  private config: BlockValidationConfig;
  private logger: Logger;
  private poiValidator: ProofOfIntelligence;
  private merkleTree: MerkleTree;

  constructor(
    config: BlockValidationConfig,
    poiValidator: ProofOfIntelligence,
    merkleTree: MerkleTree,
    logger: Logger
  ) {
    this.config = config;
    this.poiValidator = poiValidator;
    this.merkleTree = merkleTree;
    this.logger = logger;
  }

  async validateBlock(block: Block, parentBlock?: Block): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    try {
      // Basic structure validation
      this.validateBlockStructure(block, errors);

      if (errors.length > 0) {
        return {
          valid: false,
          errors,
          warnings,
        };
      }

      // Validate block size
      this.validateBlockSize(block, errors);

      // Validate transactions
      await this.validateTransactions(block, errors, warnings);

      // Validate merkle root
      this.validateMerkleRoot(block, errors);

      // Validate parent hash
      if (parentBlock) {
        this.validateParentHash(block, parentBlock, errors);
      }

      // Validate timestamp bounds
      this.validateTimestampBounds(block, parentBlock, errors);

      // Validate proof of intelligence
      await this.validateProofOfIntelligence(block, errors);

      // Validate nonce and difficulty
      this.validateDifficulty(block, errors);

      const hasCriticalErrors = errors.some((e) => e.severity === 'critical');

      return {
        valid: !hasCriticalErrors,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Unexpected error during block validation', {
        error,
        blockHash: block.hash,
      });

      errors.push({
        code: 'VALIDATION_ERROR',
        message: `Unexpected error during validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
      });

      return {
        valid: false,
        errors,
        warnings,
      };
    }
  }

  private validateBlockStructure(block: Block, errors: ValidationError[]): void {
    if (!block.header || typeof block.header !== 'object') {
      errors.push({
        code: 'INVALID_HEADER',
        message: 'Block header is missing or invalid',
        severity: 'critical',
      });
      return;
    }

    if (!block.header.version || typeof block.header.version !== 'number') {
      errors.push({
        code: 'INVALID_VERSION',
        message: 'Block version is missing or invalid',
        severity: 'critical',
      });
    }

    if (!block.header.previousHash || typeof block.header.previousHash !== 'string') {
      errors.push({
        code: 'INVALID_PREVIOUS_HASH',
        message: 'Previous block hash is missing or invalid',
        severity: 'critical',
      });
    }

    if (!block.header.merkleRoot || typeof block.header.merkleRoot !== 'string') {
      errors.push({
        code: 'INVALID_MERKLE_ROOT',
        message: 'Merkle root is missing or invalid',
        severity: 'critical',
      });
    }

    if (block.header.timestamp === undefined || typeof block.header.timestamp !== 'number') {
      errors.push({
        code: 'INVALID_TIMESTAMP',
        message: 'Block timestamp is missing or invalid',
        severity: 'critical',
      });
    }

    if (!Array.isArray(block.transactions)) {
      errors.push({
        code: 'INVALID_TRANSACTIONS',
        message: 'Block transactions must be an array',
        severity: 'critical',
      });
    }

    if (!block.poi || typeof block.poi !== 'object') {
      errors.push({
        code: 'INVALID_POI',
        message: 'Proof of Intelligence is missing or invalid',
        severity: 'critical',
      });
    }

    if (!block.hash || typeof block.hash !== 'string') {
      errors.push({
        code: 'INVALID_HASH',
        message: 'Block hash is missing or invalid',
        severity: 'critical',
      });
    }
  }

  private validateBlockSize(block: Block, errors: ValidationError[]): void {
    let blockSize = 0;

    // Calculate header size (approximate)
    blockSize += 4; // version
    blockSize += 64; // previousHash
    blockSize += 64; // merkleRoot
    blockSize += 8; // timestamp
    blockSize += 8; // difficulty
    blockSize += 64; // hash

    // Add transaction sizes
    if (Array.isArray(block.transactions)) {
      for (const tx of block.transactions) {
        blockSize += this.getTransactionSize(tx);
      }
    }

    // Add POI proof size
    if (block.poi && block.poi.proof) {
      blockSize += block.poi.proof.length * 2; // rough estimate for hex string
    }

    if (blockSize > this.config.maxBlockSize) {
      errors.push({
        code: 'BLOCK_TOO_LARGE',
        message: `Block size (${blockSize} bytes) exceeds maximum allowed size (${this.config.maxBlockSize} bytes)`,
        severity: 'critical',
      });
    }
  }

  private getTransactionSize(tx: Transaction): number {
    let size = 0;
    size += 64; // from address
    size += 64; // to address
    size += 16; // amount
    size += 8; // nonce
    size += 128; // signature

    if (tx.data) {
      size += typeof tx.data === 'string' ? tx.data.length : JSON.stringify(tx.data).length;
    }

    return size;
  }

  private async validateTransactions(
    block: Block,
    errors: ValidationError[],
    warnings: string[]
  ): Promise<void> {
    const transactions = block.transactions || [];

    if (transactions.length === 0) {
      warnings.push('Block contains no transactions');
    }

    if (transactions.length > this.config.maxTransactions) {
      errors.push({
        code: 'TOO_MANY_TRANSACTIONS',
        message: `Block contains ${transactions.length} transactions, maximum is ${this.config.maxTransactions}`,
        severity: 'critical',
      });
      return;
    }

    const seenHashes = new Set<string>();

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];

      // Check for duplicate transactions
      if (tx.hash && seenHashes.has(tx.hash)) {
        errors.push({
          code: 'DUPLICATE_TRANSACTION',
          message: `Duplicate transaction found at index ${i}: ${tx.hash}`,
          severity: 'critical',
        });
        continue;
      }

      if (tx.hash) {
        seenHashes.add(tx.hash);
      }

      // Validate