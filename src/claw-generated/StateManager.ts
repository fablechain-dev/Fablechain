import { MerklePatriciaTrie } from './MerklePatriciaTrie';

class StateManager {
  private currentState: MerklePatriciaTrie;
  private previousState: MerklePatriciaTrie;

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
}

export { StateManager };