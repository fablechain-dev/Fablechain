import { MerklePatriciaTrie } from './MerklePatriciaTrie';

export class StateSnapshot {
  private trie: MerklePatriciaTrie;

  constructor() {
    this.trie = new MerklePatriciaTrie();
  }

  set(key: string, value: any): void {
    this.trie.set(key, value);
  }

  get(key: string): any {
    return this.trie.get(key);
  }

  getRoot(): string {
    return this.trie.getRoot();
  }

  merge(other: StateSnapshot): void {
    const keys = other.trie.getAllKeys();
    for (const key of keys) {
      this.trie.set(key, other.trie.get(key));
    }
  }
}