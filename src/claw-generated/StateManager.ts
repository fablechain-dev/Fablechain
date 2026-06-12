import { MerklePatriciaTrie } from './MerklePatriciaTrie';
import { StateSnapshot } from './StateSnapshot';

class StateManager {
  private currentState: StateSnapshot;
  private previousState: StateSnapshot;

  constructor() {
    this.currentState = new StateSnapshot();
    this.previousState = new StateSnapshot();
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
    return this.currentState.trie.getProof(key);
  }

  verifyProof(key: string, value: any, proof: any[]): boolean {
    return this.currentState.trie.verifyProof(key, value, proof);
  }

  getStateDiff(): StateSnapshot {
    const diff = new StateSnapshot();
    const previousKeys = this.previousState.trie.getAllKeys();
    const currentKeys = this.currentState.trie.getAllKeys();

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

  applyStateDiff(diff: StateSnapshot): void {
    const keys = diff.trie.getAllKeys();
    for (const key of keys) {
      const value = diff.get(key);
      if (value === null) {
        this.currentState.trie.delete(key);
      } else {
        this.currentState.trie.set(key, value);
      }
    }
    this.previousState = this.currentState;
    this.currentState = new StateSnapshot();
    this.currentState.merge(this.previousState);
  }
}

export { StateManager };