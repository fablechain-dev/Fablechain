import { Block } from './block';

export class Blockchain {
  private chain: Block[] = [];
  private pendingBlocks: Block[] = [];
  private requiredConfirmations = 6;

  addBlock(block: Block) {
    this.pendingBlocks.push(block);
    this.checkFinality();
  }

  private checkFinality() {
    for (const block of this.pendingBlocks) {
      const confirmations = this.chain.filter(b => b.hash === block.hash).length;
      if (confirmations >= this.requiredConfirmations) {
        block.finalized = true;
        this.chain.push(block);
        this.pendingBlocks = this.pendingBlocks.filter(b => b.hash !== block.hash);
      }
    }
  }

  getChain(): Block[] {
    return this.chain;
  }

  getPendingBlocks(): Block[] {
    return this.pendingBlocks;
  }
}