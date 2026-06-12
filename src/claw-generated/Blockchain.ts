import { Block } from './Block';

export class Blockchain {
  private chain: Block[] = [];

  addBlock(block: Block): void {
    // Implement block addition logic
  }

  isChainValid(): boolean {
    // Implement chain validation logic
    return true;
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }
}