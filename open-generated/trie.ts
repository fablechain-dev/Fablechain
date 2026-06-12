import { KeyValueStore } from './keyvalue';
import LRUCache from 'lru-cache';

class TrieNode {
  key: string;
  value: any;
  children: Map<string, TrieNode>;

  constructor(key: string, value?: any) {
    this.key = key;
    this.value = value;
    this.children = new Map();
  }

  addChild(key: string, value?: any): TrieNode {
    const child = new TrieNode(key, value);
    this.children.set(key, child);
    return child;
  }

  getChild(key: string): TrieNode | undefined {
    return this.children.get(key);
  }
}

class Trie {
  root: TrieNode;
  store: KeyValueStore;
  cache: LRUCache<string, TrieNode>;
  batchedUpdates: Map<string, TrieNode>;

  constructor(store: KeyValueStore, cacheSize: number = 1000) {
    this.root = new TrieNode('');
    this.store = store;
    this.cache = new LRUCache<string, TrieNode>({
      max: cacheSize,
      ttl: 1000 * 60 * 5, // 5 minutes
    });
    this.batchedUpdates = new Map();
  }

  async get(key: string): Promise<any> {
    const nodes = await this.getNodes(key);
    if (nodes.length === 0) {
      return undefined;
    }
    return nodes[nodes.length - 1].value;
  }

  async set(key: string, value: any): Promise<void> {
    const nodes = await this.getNodes(key, true);
    let currentNode = this.root;
    for (const nodeKey of nodes) {
      const child = currentNode.getChild(nodeKey);
      if (child) {
        currentNode = child;
      } else {
        currentNode = currentNode.addChild(nodeKey);
      }
      this.cache.set(child?.key || currentNode.key, currentNode);
      this.batchedUpdates.set(currentNode.key, currentNode);
    }
    currentNode.value = value;
    this.batchedUpdates.set(currentNode.key, currentNode);
    await this.persistBatchedUpdates();
  }

  async delete(key: string): Promise<void> {
    const nodes = await this.getNodes(key, true);
    if (nodes.length === 0) {
      return;
    }
    let currentNode = this.root;
    for (let i = 0; i < nodes.length - 1; i++) {
      const nodeKey = nodes[i];
      const child = currentNode.getChild(nodeKey);
      if (child) {
        currentNode = child;
      } else {
        return;
      }
    }
    const leafNode = nodes[nodes.length - 1];
    currentNode.children.delete(leafNode);
    this.batchedUpdates.set(currentNode.key, currentNode);
    this.cache.del(leafNode);
    await this.persistBatchedUpdates();
  }

  private async getNodes(key: string, loadAll: boolean = false): Promise<TrieNode[]> {
    const nodes: TrieNode[] = [];
    let currentNode = this.root;
    for (const nodeKey of key.split('/')) {
      const cachedNode = this.cache.get(currentNode.key + '/' + nodeKey);
      if (cachedNode) {
        nodes.push(cachedNode);
        currentNode = cachedNode;
      } else {
        const child = currentNode.getChild(nodeKey);
        if (child) {
          nodes.push(child);
          currentNode = child;
        } else if (loadAll) {
          const childNode = await this.store.get<TrieNode>(currentNode.key + '/' + nodeKey);
          if (childNode) {
            nodes.push(childNode);
            currentNode = childNode;
          } else {
            return nodes;
          }
        } else {
          return nodes;
        }
      }
    }
    return nodes;
  }

  private async persistBatchedUpdates(): Promise<void> {
    for (const [key, node] of this.batchedUpdates) {
      await this.store.set(key, node);
    }
    this.batchedUpdates.clear();
  }
}

export { Trie, TrieNode };