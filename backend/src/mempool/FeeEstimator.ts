```typescript
import { EventEmitter } from 'events';

export interface FeeEstimate {
  baseFee: bigint;
  priorityFee: bigint;
  maxFeePerGas: bigint;
  estimatedTime: number;
}

export interface PriorityFeePercentiles {
  p10: bigint;
  p25: bigint;
  p50: bigint;
  p75: bigint;
  p90: bigint;
}

export interface BlockFeeData {
  blockNumber: number;
  baseFee: bigint;
  gasUsed: bigint;
  gasLimit: bigint;
  timestamp: number;
  transactions: TransactionFeeData[];
}

export interface TransactionFeeData {
  priorityFee: bigint;
  maxFeePerGas: bigint;
  gasUsed: number;
}

interface FeeHistoryWindow {
  blocks: BlockFeeData[];
  lastUpdated: number;
}

const DEFAULT_BASE_FEE_CHANGE_DENOMINATOR = 8n;
const DEFAULT_ELASTICITY_MULTIPLIER = 2n;
const DEFAULT_TARGET_GAS_USAGE_RATIO = 0.5;
const HISTORY_WINDOW_SIZE = 20;
const MIN_BASE_FEE = 1n;
const MAX_BASE_FEE = BigInt('1000000000000000000'); // 1 ETH in wei

export class FeeEstimator extends EventEmitter {
  private feeHistory: FeeHistoryWindow;
  private currentBaseFee: bigint;
  private lastBlockNumber: number;
  private baseChangeDenominator: bigint;
  private elasticityMultiplier: bigint;
  private targetGasUsageRatio: number;
  private minBaseFee: bigint;
  private maxBaseFee: bigint;

  constructor(
    initialBaseFee: bigint = BigInt('20000000000'), // 20 Gwei
    options?: {
      baseChangeDenominator?: bigint;
      elasticityMultiplier?: bigint;
      targetGasUsageRatio?: number;
      minBaseFee?: bigint;
      maxBaseFee?: bigint;
    }
  ) {
    super();
    this.currentBaseFee = initialBaseFee;
    this.lastBlockNumber = 0;
    this.feeHistory = {
      blocks: [],
      lastUpdated: Date.now(),
    };
    this.baseChangeDenominator = options?.baseChangeDenominator ?? DEFAULT_BASE_FEE_CHANGE_DENOMINATOR;
    this.elasticityMultiplier = options?.elasticityMultiplier ?? DEFAULT_ELASTICITY_MULTIPLIER;
    this.targetGasUsageRatio = options?.targetGasUsageRatio ?? DEFAULT_TARGET_GAS_USAGE_RATIO;
    this.minBaseFee = options?.minBaseFee ?? MIN_BASE_FEE;
    this.maxBaseFee = options?.maxBaseFee ?? MAX_BASE_FEE;
  }

  public addBlock(blockData: BlockFeeData): void {
    if (blockData.blockNumber <= this.lastBlockNumber) {
      throw new Error(
        `Invalid block number: ${blockData.blockNumber} must be greater than ${this.lastBlockNumber}`
      );
    }

    // Update base fee using EIP-1559 formula
    this.updateBaseFee(blockData);

    // Add to history
    this.feeHistory.blocks.push(blockData);

    // Maintain history window size
    if (this.feeHistory.blocks.length > HISTORY_WINDOW_SIZE) {
      this.feeHistory.blocks.shift();
    }

    this.feeHistory.lastUpdated = Date.now();
    this.lastBlockNumber = blockData.blockNumber;

    this.emit('blockProcessed', {
      blockNumber: blockData.blockNumber,
      baseFee: this.currentBaseFee,
    });
  }

  private updateBaseFee(blockData: BlockFeeData): void {
    const gasTarget = blockData.gasLimit / 2n;
    const gasUsedRatio = blockData.gasUsed / blockData.gasLimit;

    if (blockData.gasUsed > gasTarget) {
      // Network congested, increase base fee
      const delta = blockData.baseFee * (blockData.gasUsed - gasTarget) / gasTarget / this.baseChangeDenominator;
      this.currentBaseFee = this.currentBaseFee + delta;
    } else if (blockData.gasUsed < gasTarget) {
      // Network underutilized, decrease base fee
      const delta = blockData.baseFee * (gasTarget - blockData.gasUsed) / gasTarget / this.baseChangeDenominator;
      this.currentBaseFee = this.currentBaseFee > (delta + this.minBaseFee) 
        ? this.currentBaseFee - delta 
        : this.minBaseFee;
    }

    // Enforce bounds
    if (this.currentBaseFee > this.maxBaseFee) {
      this.currentBaseFee = this.maxBaseFee;
    }
    if (this.currentBaseFee < this.minBaseFee) {
      this.currentBaseFee = this.minBaseFee;
    }
  }

  public estimateFee(urgency: 'low' | 'standard' | 'fast' | 'instant' = 'standard'): FeeEstimate {
    const priorityFeePercentiles = this.calculatePriorityFeePercentiles();
    
    let priorityFee: bigint;
    let estimatedTime: number;

    switch (urgency) {
      case 'low':
        priorityFee = priorityFeePercentiles.p10;
        estimatedTime = 60; // ~15 blocks at 4s per block
        break;
      case 'standard':
        priorityFee = priorityFeePercentiles.p50;
        estimatedTime = 20; // ~5 blocks
        break;
      case 'fast':
        priorityFee = priorityFeePercentiles.p90;
        estimatedTime = 5; // ~1-2 blocks
        break;
      case 'instant':
        priorityFee = priorityFeePercentiles.p95 || (priorityFeePercentiles.p90 * 2n);
        estimatedTime = 1;
        break;
      default:
        throw new Error(`Unknown urgency level: ${urgency}`);
    }

    const maxFeePerGas = this.currentBaseFee + priorityFee;

    return {
      baseFee: this.currentBaseFee,
      priorityFee,
      maxFeePerGas,
      estimatedTime,
    };
  }

  private calculatePriorityFeePercentiles(): PriorityFeePercentiles & { p95?: bigint } {
    if (this.feeHistory.blocks.length === 0) {
      const defaultPriority = BigInt('1000000000'); // 1 Gwei
      return {
        p10: defaultPriority,
        p25: defaultPriority,
        p50: defaultPriority,
        p75: defaultPriority,
        p90: defaultPriority,
        p95: defaultPriority * 2n,
      };
    }

    // Collect all priority fees from recent blocks, weighted by gas used
    const allPriorityFees: bigint[] = [];
    
    for (const block of this.feeHistory.blocks) {
      for (const tx of block.transactions) {
        // Include priority fee proportionally to gas used
        const count = Math.max(1, Math.floor(Number(tx.gasUsed) / 21000));
        for (let i = 0; i < count; i++) {
          allPriorityFees.push(tx.priorityFee);
        }
      }
    }

    if (allPriorityFees.length === 0) {
      const defaultPriority = BigInt('1000000000');
      return