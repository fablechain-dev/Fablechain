```typescript
import { EventEmitter } from 'events';

export interface BlockMetrics {
  blockNumber: number;
  baseFee: bigint;
  gasUsed: bigint;
  gasLimit: bigint;
  timestamp: number;
  transactions: TransactionMetrics[];
}

export interface TransactionMetrics {
  hash: string;
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasUsed: bigint;
}

export interface FeeEstimate {
  baseFee: bigint;
  priorityFee: bigint;
  maxFeePerGas: bigint;
  confidence: number;
  timestamp: number;
}

export interface PriorityFeePercentiles {
  p10: bigint;
  p25: bigint;
  p50: bigint;
  p75: bigint;
  p90: bigint;
  p99: bigint;
}

class FeeEstimator extends EventEmitter {
  private blockHistory: BlockMetrics[] = [];
  private maxHistorySize: number = 50;
  private baseFeeAdjustmentFactor: bigint = 12500n; // 1.125x in basis points
  private readonly MIN_BASE_FEE: bigint = 1n;
  private readonly MAX_PRIORITY_FEE: bigint = BigInt(100) * BigInt(10) ** BigInt(9); // 100 Gwei
  private lastProcessedBlock: number = 0;

  constructor(maxHistorySize: number = 50) {
    super();
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Add a new block to the history and update fee estimates
   */
  public addBlock(block: BlockMetrics): void {
    if (block.blockNumber <= this.lastProcessedBlock) {
      throw new Error('Block number must be greater than last processed block');
    }

    this.blockHistory.push(block);
    this.lastProcessedBlock = block.blockNumber;

    // Maintain max history size
    if (this.blockHistory.length > this.maxHistorySize) {
      this.blockHistory.shift();
    }

    this.emit('blockAdded', block);
  }

  /**
   * Calculate base fee for the next block using EIP-1559 formula
   */
  private calculateNextBaseFee(): bigint {
    if (this.blockHistory.length === 0) {
      return this.MIN_BASE_FEE;
    }

    const lastBlock = this.blockHistory[this.blockHistory.length - 1];
    const { gasUsed, gasLimit, baseFee } = lastBlock;

    // If gas used equals target (gas limit / 2), baseFee stays the same
    const gasTarget = gasLimit / 2n;

    if (gasUsed > gasTarget) {
      // Network congested, increase baseFee
      const gasDelta = gasUsed - gasTarget;
      const baseFeePerGasDelta = (baseFee * gasDelta) / gasTarget / 8n;
      return baseFee + baseFeePerGasDelta;
    } else if (gasUsed < gasTarget) {
      // Network underutilized, decrease baseFee
      const gasDelta = gasTarget - gasUsed;
      const baseFeePerGasDelta = (baseFee * gasDelta) / gasTarget / 8n;
      const newBaseFee = baseFee - baseFeePerGasDelta;
      return newBaseFee < this.MIN_BASE_FEE ? this.MIN_BASE_FEE : newBaseFee;
    }

    return baseFee;
  }

  /**
   * Extract priority fees from recent blocks and calculate percentiles
   */
  private calculatePriorityFeePercentiles(): PriorityFeePercentiles {
    const recentBlocks = this.blockHistory.slice(-12); // Last 12 blocks

    if (recentBlocks.length === 0) {
      const defaultFee = BigInt(1) * BigInt(10) ** BigInt(9); // 1 Gwei
      return {
        p10: defaultFee,
        p25: defaultFee,
        p50: defaultFee,
        p75: defaultFee,
        p90: defaultFee,
        p99: defaultFee,
      };
    }

    const priorityFees: bigint[] = [];

    for (const block of recentBlocks) {
      for (const tx of block.transactions) {
        if (tx.maxPriorityFeePerGas > 0n) {
          priorityFees.push(tx.maxPriorityFeePerGas);
        }
      }
    }

    // If no priority fees found, return defaults
    if (priorityFees.length === 0) {
      const defaultFee = BigInt(1) * BigInt(10) ** BigInt(9);
      return {
        p10: defaultFee,
        p25: defaultFee,
        p50: defaultFee,
        p75: defaultFee,
        p90: defaultFee,
        p99: defaultFee,
      };
    }

    // Sort fees in ascending order
    priorityFees.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0));

    return {
      p10: this.percentile(priorityFees, 10),
      p25: this.percentile(priorityFees, 25),
      p50: this.percentile(priorityFees, 50),
      p75: this.percentile(priorityFees, 75),
      p90: this.percentile(priorityFees, 90),
      p99: this.percentile(priorityFees, 99),
    };
  }

  /**
   * Calculate percentile value from sorted array
   */
  private percentile(sortedArray: bigint[], percentile: number): bigint {
    if (sortedArray.length === 0) {
      return 0n;
    }

    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    const clampedIndex = Math.max(0, Math.min(index, sortedArray.length - 1));
    return sortedArray[clampedIndex];
  }

  /**
   * Get current fee estimate with multiple priority tiers
   */
  public estimateFees(): FeeEstimate {
    const nextBaseFee = this.calculateNextBaseFee();
    const percentiles = this.calculatePriorityFeePercentiles();

    // Use 75th percentile as standard priority fee
    const priorityFee = percentiles.p75;

    // Calculate confidence based on block history consistency
    const confidence = this.calculateConfidence();

    return {
      baseFee: nextBaseFee,
      priorityFee: priorityFee > this.MAX_PRIORITY_FEE ? this.MAX_PRIORITY_FEE : priorityFee,
      maxFeePerGas: nextBaseFee + priorityFee,
      confidence,
      timestamp: Date.now(),
    };
  }

  /**
   * Get fee estimates for different priority levels
   */
  public estimateFeeTiers(): {
    low: FeeEstimate;
    standard: FeeEstimate;
    fast: FeeEstimate;
    instant: FeeEstimate;
  } {
    const nextBaseFee = this.calculateNextBaseFee();
    const percentiles = this.calculatePriorityFeePercentiles();
    const confidence = this.calculateConfidence();
    const now = Date.now();

    const createEstimate = (priorityFee: bigint): FeeEstimate => ({
      baseFee: nextBaseFee,
      priorityFee: priorityFee > this.MAX_PRIORITY_FEE ? this.MAX_PRIORITY_FEE : priorityFee,
      maxFeePerGas: nextBaseFee + priorityFee,
      confidence,
      timestamp: now,
    });

    return {
      low: createEstimate(percentiles