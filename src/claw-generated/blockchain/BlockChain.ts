import { Block } from './Block';
import { UncleBlock } from './UncleBlock';

export class BlockChain {
  private blocks: (Block | UncleBlock)[] = [];

  async addBlock(block: Block): Promise<void> {
    // Existing logic to add a new main chain block
    this.blocks.push(block);
  }

  async addUncleBlock(block: UncleBlock): Promise<void> {
    // Add the uncle block to the chain
    this.blocks.push(block);

    // Adjust the rewards for the main chain blocks affected by the uncle block
    await this.adjustRewardsForMainChainBlocks(block);
  }

  private async adjustRewardsForMainChainBlocks(uncleBlock: UncleBlock): Promise<void> {
    // Iterate through the main chain blocks and adjust their rewards based on the uncle block
    for (const block of this.blocks) {
      if (block instanceof Block && block.height > uncleBlock.height) {
        block.reward -= uncleBlock.getReward();
      }
    }
  }
}