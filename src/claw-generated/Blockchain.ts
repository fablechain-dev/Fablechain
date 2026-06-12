import { Block } from './Block';
import { Transaction } from './Transaction';

export class Blockchain {
  private chain: Block[] = [];
  private pendingTransactions: Transaction[] = [];
  private targetBlockSize: number = 500000; // 500 KB
  private blockSizeAdjustmentFactor: number = 1.1;

  constructor() {
    // Create the genesis block
    this.addBlock(
      new Block(
        0,
        Date.now(),
        [],
        '0000000000000000000000000000000000000000000000000000000000000000',
        '0000000000000000000000000000000000000000000000000000000000000000'
      )
    );
  }

  public addBlock(block: Block): void {
    // Validate the block
    if (!block.isValid()) {
      throw new Error('Invalid block');
    }

    this.chain.push(block);

    // Adjust the max block size based on the current block size
    this.adjustMaxBlockSize(block.size);
  }

  private adjustMaxBlockSize(currentBlockSize: number): void {
    if (currentBlockSize > this.targetBlockSize) {
      this.block.maxSize = Math.floor(this.block.maxSize * this.blockSizeAdjustmentFactor);
    } else {
      this.block.maxSize = Math.floor(this.block.maxSize / this.blockSizeAdjustmentFactor);
    }
  }

  public addTransaction(transaction: Transaction): void {
    this.pendingTransactions.push(transaction);
  }

  public mineBlock(): Block {
    // Create a new block with the pending transactions
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      this.pendingTransactions,
      this.chain[this.chain.length - 1].hash,
      ''
    );

    // Add the new block to the chain
    this.addBlock(newBlock);

    // Clear the pending transactions
    this.pendingTransactions = [];

    return newBlock;
  }
}