import { Block } from './Block';

export class Chain {
  private blocks: Block[] = [];

  addBlock(block: Block): void {
    if (this.isValid(block)) {
      this.blocks.push(block);
    } else {
      throw new Error('Invalid block');
    }
  }

  isValid(block: Block): boolean {
    // Implement chain validation logic
    return true;
  }

  getLatestBlock(): Block {
    return this.blocks[this.blocks.length - 1];
  }

  getBlocks(): Block[] {
    return this.blocks;
  }
}