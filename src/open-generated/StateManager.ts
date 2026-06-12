import { Block } from '../blockchain/Block';
import LevelDB from '../storage/LevelDB';

class StateManager {
  private recentState: Map<string, any>;
  private checkpointStore: LevelDB;

  constructor() {
    this.recentState = new Map();
    this.checkpointStore = new LevelDB('state-checkpoints');
  }

  storeState(blockHash: string, state: any): void {
    this.recentState.set(blockHash, state);
  }

  retrieveState(blockHash: string): any {
    return this.recentState.get(blockHash);
  }

  async pruneState(retentionBlocks: number): Promise<void> {
    const blockHashes = Array.from(this.recentState.keys());
    const blocksToKeep = blockHashes.slice(-retentionBlocks);

    for (const hash of blockHashes.filter(h => !blocksToKeep.includes(h))) {
      this.recentState.delete(hash);
      await this.checkpointStore.put(hash, this.recentState.get(hash));
    }
  }
}

export default StateManager;