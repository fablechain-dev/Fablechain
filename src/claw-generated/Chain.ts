import { Block } from './Block';

export class Chain {
  private blocks: Block[] = [];

  constructor() {
    // Create the genesis block
    this.addBlock(new Block(0, Date.now(), 'Genesis Block', '0'));
  }

  private addBlock(block: Block): void {
    this.blocks.push(block);
  }

  public getBlocks(): Block[] {
    return this.blocks;
  }
}