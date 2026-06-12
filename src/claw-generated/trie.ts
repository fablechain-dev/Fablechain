import { StateNode } from './node';
import { StateDB } from './db';
import { LRUCache } from './cache';

export class StateTrie {
  private db: StateDB;
  private root: StateNode;
  private cache: LRUCache<string, StateNode>;

  constructor(db: StateDB) {
    this.db = db;
    this.root = new StateNode();
    this.cache = new LRUCache<string, StateNode>(1000);
  }

  async get(key: Uint8Array): Promise<Uint8Array | null> {
    const cacheKey = this.getCacheKey(key);
    const cachedNode = this.cache.get(cacheKey);
    if (cachedNode) {
      return await cachedNode.get(key, this.db);
    }

    const node = await this.root.get(key, this.db);
    this.cache.set(cacheKey, node);
    return node;
  }

  async set(key: Uint8Array, value: Uint8Array): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    const node = await this.root.set(key, value, this.db);
    this.cache.set(cacheKey, node);
  }

  async commit(): Promise<Uint8Array> {
    const hash = await this.root.commit(this.db);
    this.cache.clear();
    return hash;
  }

  private getCacheKey(key: Uint8Array): string {
    return key.toString();
  }
}