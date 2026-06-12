import { keccak256 } from 'js-sha3';
import { TrieCache } from './TrieCache';

class MerklePatriciaTrie {
  private root: Node | null;
  private cache: TrieCache;

  constructor(cacheCapacity: number) {
    this.root = null;
    this.cache = new TrieCache(cacheCapacity);
  }

  getRoot(): string {
    return this.root ? this.hash(this.root) : '';
  }

  set(key: string, value: any): void {
    this.root = this.updateNode(this.root, key.split(''), value);
  }

  get(key: string): any {
    const node = this.findNode(this.root, key.split(''));
    return node ? node.value : undefined;
  }

  getProof(key: string): any[] {
    const proof: any[] = [];
    this.findProof(this.root, key.split(''), proof);
    return proof;
  }

  verifyProof(key: string, value: any, proof: any[]): boolean {
    let node: Node | null = null;
    for (const item of proof) {
      node = this.verifyProofItem(node, item);
      if (!node) {
        return false;
      }
    }
    return node && node.value === value;
  }

  private updateNode(node: Node | null, key: string[], value: any): Node {
    if (key.length === 0) {
      return { key: '', value, children: {} };
    }

    const currentKey = key[0];
    if (!node) {
      return { key: currentKey, value: null, children: { [key[1] || '']: this.updateNode(null, key.slice(1), value) } };
    }

    if (node.key === currentKey) {
      const cachedNode = this.cache.get(this.hash(node));
      if (cachedNode) {
        node = cachedNode;
      }
      node.children[key[1] || ''] = this.updateNode(node.children[key[1] || ''], key.slice(1), value);
    } else {
      const newNode = { key: currentKey, value: null, children: { [key[1] || '']: this.updateNode(null, key.slice(1), value) } };
      node.children[currentKey] = newNode;
    }

    // Cache the updated node
    this.cacheNode(node);

    return node;
  }

  private findNode(node: Node | null, key: string[]): Node | null {
    if (!node) {
      return null;
    }

    if (key.length === 0) {
      return node;
    }

    const currentKey = key[0];
    if (node.key === currentKey) {
      // Check if the node is in the cache
      const cachedNode = this.cache.get(this.hash(node));
      if (cachedNode) {
        return this.findNode(cachedNode, key.slice(1));
      } else {
        return this.findNode(node.children[key[1] || ''], key.slice(1));
      }
    }

    return null;
  }

  private findProof(node: Node | null, key: string[], proof: any[]): void {
    if (!node) {
      return;
    }

    proof.push({ key: node.key, value: node.value, hash: this.hash(node) });

    if (key.length > 0) {
      const currentKey = key[0];
      if (node.key === currentKey) {
        this.findProof(node.children[key[1] || ''], key.slice(1), proof);
      }
    }
  }

  private verifyProofItem(node: Node | null, item: any): Node | null {
    if (!item) {
      return node;
    }

    if (!node || this.hash(node) !== item.hash) {
      return null;
    }

    return { key: item.key, value: item.value, children: {} };
  }

  private hash(node: Node): string {
    return keccak256(JSON.stringify(node));
  }

  private cacheNode(node: Node): void {
    this.cache.set(this.hash(node), node);
  }
}

type Node = {
  key: string;
  value: any;
  children: { [key: string]: Node };
};

export { MerklePatriciaTrie };