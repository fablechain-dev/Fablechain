import { StateManager } from './StateManager';

class Blockchain {
  private stateManager: StateManager = new StateManager();

  async addBlock(block: Block): Promise<void> {
    // Add block to chain
    await this.stateManager.addState(block.number, block.state);
  }

  async getBlockState(blockNumber: number): Promise<StateData> {
    return await this.stateManager.getState(blockNumber);
  }
}