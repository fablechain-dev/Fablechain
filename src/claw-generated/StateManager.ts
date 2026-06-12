import { STATE_PRUNING_PERIOD } from './config';

class StateManager {
  private stateStore: Map<number, StateData> = new Map();
  private archivedStates: Map<number, StateData> = new Map();

  async getState(blockNumber: number): Promise<StateData> {
    if (this.stateStore.has(blockNumber)) {
      return this.stateStore.get(blockNumber)!;
    }
    if (this.archivedStates.has(blockNumber)) {
      return this.archivedStates.get(blockNumber)!;
    }
    // Fetch state from archive or rebuild from history
  }

  async addState(blockNumber: number, state: StateData): Promise<void> {
    this.stateStore.set(blockNumber, state);
    this.maybeArchiveOldState(blockNumber);
  }

  private maybeArchiveOldState(currentBlockNumber: number): void {
    const oldestBlockNumber = currentBlockNumber - STATE_PRUNING_PERIOD;
    if (oldestBlockNumber > 0) {
      for (let i = 1; i <= oldestBlockNumber; i++) {
        if (this.stateStore.has(i)) {
          this.archivedStates.set(i, this.stateStore.get(i)!);
          this.stateStore.delete(i);
        }
      }
    }
  }
}