import { MerklePatriciaTrie } from './MerklePatriciaTrie';

class StateManager {
  private currentState: MerklePatriciaTrie;
  private previousState: MerklePatriciaTrie;
  private archivedStates: MerklePatriciaTrie[] = [];

  constructor() {
    this.currentState = new MerklePatriciaTrie();
    this.previousState = new MerklePatriciaTrie();
  }

  getStateRoot(): string {
    return this.currentState.getRoot();
  }

  setState(key: string, value: any): void {
    this.currentState.set(key, value);
  }

  getState(key: string): any {
    return this.currentState.get(key);
  }

  getProof(key: string): any[] {
    return this.currentState.getProof(key);
  }

  verifyProof(key: string, value: any, proof: any[]): boolean {
    return this.currentState.verifyProof(key, value, proof);
  }

  getStateDiff(): MerklePatriciaTrie {
    const diff = new MerklePatriciaTrie();
    const previousKeys = this.previousState.getAllKeys();
    const currentKeys = this.currentState.getAllKeys();

    // Check for added/modified keys
    for (const key of currentKeys) {
      if (!previousKeys.includes(key) || this.currentState.get(key) !== this.previousState.get(key)) {
        diff.set(key, this.currentState.get(key));
      }
    }

    // Check for deleted keys
    for (const key of previousKeys) {
      if (!currentKeys.includes(key)) {
        diff.set(key, null);
      }
    }

    return diff;
  }

  applyStateDiff(diff: MerklePatriciaTrie): void {
    const keys = diff.getAllKeys();
    for (const key of keys) {
      const value = diff.get(key);
      if (value === null) {
        this.currentState.delete(key);
      } else {
        this.currentState.set(key, value);
      }
    }
    this.previousState = this.currentState;
    this.currentState = new MerklePatriciaTrie();
    this.currentState.merge(this.previousState);
  }

  pruneState(maxBlockHeight: number): void {
    // Remove state data for blocks older than the specified max height
    const currentBlockHeight = this.getCurrentBlockHeight();
    const keepBlockHeight = currentBlockHeight - maxBlockHeight;

    // Remove old state data from the current and previous state tries
    this.currentState.pruneOldData(keepBlockHeight);
    this.previousState.pruneOldData(keepBlockHeight);

    // Add the current state to the archived states
    this.archivedStates.push(this.previousState);

    // Trim the archived states to keep only the most recent
    const maxArchivedStates = 10;
    if (this.archivedStates.length > maxArchivedStates) {
      this.archivedStates.shift();
    }
  }

  private getCurrentBlockHeight(): number {
    // Implement logic to get the current block height
    return 1000;
  }
}

export { StateManager };