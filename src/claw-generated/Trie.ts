import { DB } from '../db/DB';
import LRUCache from 'lru-cache';

class TrieNode {
  key: string;
  value: any;
  children: { [key: string]: TrieNode };

  constructor(key: string, value?: any) {
    this.key = key;
    this.value = value;
    this.children = {};
  }
}

export class Trie {
  private root: TrieNode;
  private db: DB;
  private cache: LRUCache<string, TrieNode>;
  private updateQueue: Map<string, TrieNode>;
  private deleteQueue: Set<string>;

  constructor(db: DB) {
    this.root = new TrieNode('');
    this.db = db;
    this.cache = new LRUCache<string, TrieNode>({
      max: 1000,
      ttl: 60 * 1000, // 1 minute
    });
    this.updateQueue = new Map();
    this.deleteQueue = new Set();
  }

  async get(key: string): Promise<any> {
    const cacheKey = `node:${key}`;
    let node = this.cache.get(cacheKey);
    if (!node) {
      node = await this.loadNode(key);
      this.cache.set(cacheKey, node);
    }
    return node.value;
  }

  async set(key: string, value: any): Promise<void> {
    const cacheKey = `node:${key}`;
    let node = this.cache.get(cacheKey);
    if (!node) {
      node = await this.loadNode(key);
      this.cache.set(cacheKey, node);
    }
    node.value = value;
    this.cache.set(cacheKey, node);
    this.updateQueue.set(cacheKey, node);
    this.deleteQueue.delete(cacheKey);
  }

  async delete(key: string): Promise<void> {
    const cacheKey = `node:${key}`;
    this.cache.del(cacheKey);
    this.updateQueue.delete(cacheKey);
    this.deleteQueue.add(cacheKey);
  }

  async flush(): Promise<void> {
    for (const [key, node] of this.updateQueue) {
      await this.db.put(key, node);
    }
    for (const key of this.deleteQueue) {
      await this.db.del(key);
    }
    this.updateQueue.clear();
    this.deleteQueue.clear();
    await this.db.commitBatch();
  }

  private async loadNode(key: string): Promise<TrieNode> {
    const cacheKey = `node:${key}`;
    const serializedNode = await this.db.get(cacheKey);
    if (serializedNode) {
      return JSON.parse(serializedNode.toString());
    } else {
      const node = new TrieNode(key);
      return node;
    }
  }
}