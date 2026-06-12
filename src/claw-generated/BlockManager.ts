import { Block } from './Block';
import { UncleBlock } from './UncleBlock';
import { BlockPropagator } from './block_propagator';

export class BlockManager {
  private blocks: Block[] = [];
  private uncleBlocks: UncleBlock[] = [];
  private blockPropagator: BlockPropagator;

  constructor(blockPropagator: BlockPropagator) {
    this.blockPropagator = blockPropagator;
  }

  addBlock(block: Block): void {
    this.blocks.push(block);
    this.blockPropagator.broadcastBlock(block);
  }

  addUncleBlock(uncleBlock: UncleBlock): void {
    this.uncleBlocks.push(uncleBlock);
    // No need to broadcast uncle blocks, as they are not part of the main chain
  }

  processBlocks(): void {
    for (const block of this.blocks) {
      // Handle normal block processing
      console.log(`Processing block: ${block.hash}`);
    }

    for (const uncleBlock of this.uncleBlocks) {
      // Handle uncle block processing
      console.log(`Processing uncle block: ${uncleBlock.hash} (index: ${uncleBlock.uncleIndex}, block number: ${uncleBlock.blockNumber})`);
      // Provide partial reward for uncle blocks
      // ...
    }
  }
}