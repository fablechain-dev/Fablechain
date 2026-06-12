import { Node } from './MerklePatriciaTrie';

class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private order: K[];

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    this.order = [];
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      this.order = this.order.filter((k) => k !== key);
      this.order.push(key);
      return this.cache.get(key);
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.order = this.order.filter((k) => k !== key);
    }
    this.order.push(key);
    this.cache.set(key, value);

    if (this.order.length > this.capacity) {
      const evictedKey = this.order.shift();
      if (evictedKey) {
        this.cache.delete(evictedKey);
      }
    }
  }
}

class TrieCache {
  private cache: LRUCache<string, Node>;

  constructor(capacity: number) {
    this.cache = new LRUCache<string, Node>(capacity);
  }

  get(key: string): Node | null {
    return this.cache.get(key) || null;
  }

  set(key: string, node: Node): void {
    this.cache.set(key, node);
  }
}

export { TrieCache };