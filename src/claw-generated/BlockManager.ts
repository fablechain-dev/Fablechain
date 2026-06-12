import { Block } from './Block';
import { UncleBlock } from './UncleBlock';

export class BlockManager {
  private blocks: Block[] = [];
  private uncleBlocks: UncleBlock[] = [];

  addBlock(block: Block): void {
    this.blocks.push(block);
  }

  addUncleBlock(uncleBlock: UncleBlock): void {
    this.uncleBlocks.push(uncleBlock);
  }

  processBlocks(): void {
    // Process main blocks
    for (const block of this.blocks) {
      // Handle normal block processing
      console.log(`Processing block: ${block.hash}`);
    }

    // Process uncle blocks
    for (const uncleBlock of this.uncleBlocks) {
      // Handle uncle block processing
      console.log(`Processing uncle block: ${uncleBlock.hash} (index: ${uncleBlock.uncleIndex}, block number: ${uncleBlock.blockNumber})`);

      // Provide partial reward for uncle blocks
      // ...
    }
  }
}