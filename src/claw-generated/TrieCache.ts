import { TrieNode } from './types';

class TrieCache {
  private cache: Map<string, TrieNode> = new Map();

  get(key: string): TrieNode | undefined {
    return this.cache.get(key);
  }

  set(key: string, node: TrieNode): void {
    this.cache.set(key, node);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export { TrieCache };