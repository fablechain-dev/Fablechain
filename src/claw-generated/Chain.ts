import { Block } from './Block';
import { Transaction } from '../transaction/Transaction';

export class Chain {
  private blocks: Block[];
  private finalizedBlocks: Block[];
  private pendingBlocks: Block[];
  private confirmations: number;

  constructor(confirmations: number) {
    this.blocks = [];
    this.finalizedBlocks = [];
    this.pendingBlocks = [];
    this.confirmations = confirmations;
  }

  public addBlock(block: Block): void {
    this.blocks.push(block);
    this.pendingBlocks.push(block);

    // Check if the block can be finalized
    if (this.blocks.length >= this.confirmations) {
      this.finalizeBlock(this.blocks[this.blocks.length - this.confirmations]);
    }
  }

  private finalizeBlock(block: Block): void {
    block.finalizeBlock(this.confirmations);
    this.finalizedBlocks.push(block);
    this.pendingBlocks = this.pendingBlocks.filter(b => b !== block);
  }

  public getFinalizationStatus(blockIndex: number): {
    finalized: boolean;
    confirmations: number;
  } {
    const block = this.blocks.find(b => b.index === blockIndex);
    if (!block) {
      return { finalized: false, confirmations: 0 };
    }

    const confirmations = this.blocks.length - block.index;
    return {
      finalized: block.finalized,
      confirmations,
    };
  }
}