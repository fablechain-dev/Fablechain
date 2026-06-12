import { Block } from '../Block';

export class BlockManagerExtension {
  private chain: Block[] = [];

  detectMissingBlocks() {
    let prevBlock = this.chain[0];
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      if (currentBlock.height !== prevBlock.height + 1) {
        // We're missing blocks between prevBlock and currentBlock
        const missingBlocks = [];
        for (let j = prevBlock.height + 1; j < currentBlock.height; j++) {
          missingBlocks.push(j);
        }
        return missingBlocks;
      }
      prevBlock = currentBlock;
    }
    return [];
  }
}