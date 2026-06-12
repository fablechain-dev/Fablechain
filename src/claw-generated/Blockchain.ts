import { Block } from './Block';
import { Transaction } from './Transaction';

const INITIAL_MAX_BLOCK_SIZE = 1024 * 1024; // 1 MB
const BLOCK_SIZE_ADJUSTMENT_INTERVAL = 2016; // Adjust every 2,016 blocks (2 weeks)
const BLOCK_SIZE_ADJUSTMENT_FACTOR = 1.05; // Increase by 5% if blocks are small

export class Blockchain {
  private chain: Block[] = [];
  private pendingTransactions: Transaction[] = [];
  private maxBlockSize: number = INITIAL_MAX_BLOCK_SIZE;

  addBlock(block: Block): void {
    // Validate the new block
    if (!block.isValid()) {
      throw new Error('Invalid block size');
    }

    this.chain.push(block);

    // Adjust the max block size if necessary
    if (this.chain.length % BLOCK_SIZE_ADJUSTMENT_INTERVAL === 0) {
      this.adjustMaxBlockSize();
    }
  }

  addTransaction(transaction: Transaction): void {
    this.pendingTransactions.push(transaction);
  }

  private adjustMaxBlockSize(): void {
    // Calculate the average block size over the last adjustment interval
    const blockSizes = this.chain.slice(-BLOCK_SIZE_ADJUSTMENT_INTERVAL).map(b => b.size);
    const averageBlockSize = blockSizes.reduce((sum, size) => sum + size, 0) / blockSizes.length;

    // Adjust the max block size if the average is significantly smaller than the current limit
    if (averageBlockSize < this.maxBlockSize * 0.8) {
      this.maxBlockSize = Math.floor(this.maxBlockSize * BLOCK_SIZE_ADJUSTMENT_FACTOR);
    }
  }

  // Other Blockchain methods...
}