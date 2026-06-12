import { MerklePatriciaTrie } from './MerklePatriciaTrie';

class StateManager {
  private trie: MerklePatriciaTrie;

  constructor() {
    this.trie = new MerklePatriciaTrie();
  }

  getStateRoot(): string {
    return this.trie.getRoot();
  }

  setState(key: string, value: any): void {
    this.trie.set(key, value);
  }

  getState(key: string): any {
    return this.trie.get(key);
  }

  getProof(key: string): any[] {
    return this.trie.getProof(key);
  }

  verifyProof(key: string, value: any, proof: any[]): boolean {
    return this.trie.verifyProof(key, value, proof);
  }
}

export { StateManager };