import { MerklePatriciaTrie } from './MerklePatriciaTrie';
import { ReadWriteLock } from './ReadWriteLock';

class StateManager {
  private currentState: MerklePatriciaTrie;
  private previousState: MerklePatriciaTrie;
  private archivedStates: MerklePatriciaTrie[] = [];
  private stateReadWriteLock: ReadWriteLock;

  constructor() {
    this.currentState = new MerklePatriciaTrie();
    this.previousState = new MerklePatriciaTrie();
    this.stateReadWriteLock = new ReadWriteLock();
  }

  getStateRoot(): string {
    this.stateReadWriteLock.readLock();
    const root = this.currentState.getRoot();
    this.stateReadWriteLock.readUnlock();
    return root;
  }

  setState(key: string, value: any): void {
    this.stateReadWriteLock.writeLock();
    this.currentState.set(key, value);
    this.stateReadWriteLock.writeUnlock();
  }

  getState(key: string): any {
    this.stateReadWriteLock.readLock();
    const value = this.currentState.get(key);
    this.stateReadWriteLock.readUnlock();
    return value;
  }

  getProof(key: string): any[] {
    this.stateReadWriteLock.readLock();
    const proof = this.currentState.getProof(key);
    this.stateReadWriteLock.readUnlock();
    return proof;
  }

  verifyProof(key: string, value: any, proof: any[]): boolean {
    this.stateReadWriteLock.readLock();
    const isValid = this.currentState.verifyProof(key, value, proof);
    this.stateReadWriteLock.readUnlock();
    return isValid;
  }

  getStateDiff(): MerklePatriciaTrie {
    this.stateReadWriteLock.readLock();
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
    this.stateReadWriteLock.readUnlock();
    return diff;
  }

  applyStateDiff(diff: MerklePatriciaTrie): void {
    this.stateReadWriteLock.writeLock();
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
    this.stateReadWriteLock.writeUnlock();
  }

  pruneState(maxBlockHeight: number): void {
    this.stateReadWriteLock.writeLock();
    const currentBlockHeight = this.getCurrentBlockHeight();
    const keepBlockHeight = currentBlockHeight - maxBlockHeight;

    this.currentState.pruneOldData(keepBlockHeight);
    this.previousState.pruneOldData(keepBlockHeight);

    this.archivedStates.push(this.previousState);

    const maxArchivedStates = 10;
    if (this.archivedStates.length > maxArchivedStates) {
      this.archivedStates.shift();
    }
    this.stateReadWriteLock.writeUnlock();
  }

  private getCurrentBlockHeight(): number {
    // Implement logic to get the current block height
    return 1000;
  }
}

export { StateManager };