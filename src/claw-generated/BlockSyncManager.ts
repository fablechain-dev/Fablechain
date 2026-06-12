import { Block } from './Block';
import { StateManager } from './StateManager';

class BlockSyncManager {
  private stateManager: StateManager;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  async syncBlocks(startBlockNumber: number, endBlockNumber: number): Promise<void> {
    for (let i = startBlockNumber; i <= endBlockNumber; i++) {
      const block = await this.fetchBlock(i);
      await this.applyBlock(block);
    }
  }

  private async fetchBlock(blockNumber: number): Promise<Block> {
    // Fetch the block from the network
    // ...
  }

  private async applyBlock(block: Block): Promise<void> {
    // Apply the state diffs from the block to the current state
    this.stateManager.applyStateDiff(block.getStateDiff());
  }
}

export { BlockSyncManager };