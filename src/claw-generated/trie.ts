import { keccak256 } from 'js-sha3';

class TrieNode {
  key: Uint8Array;
  value: Uint8Array | null;
  children: Map<string, TrieNode>;

  constructor(key: Uint8Array, value: Uint8Array | null) {
    this.key = key;
    this.value = value;
    this.children = new Map();
  }
}

export class MerklePatriciaTrie {
  root: TrieNode | null;

  constructor() {
    this.root = null;
  }

  insert(key: Uint8Array, value: Uint8Array): void {
    this.root = this.insertRecursive(this.root, key, 0, value);
  }

  private insertRecursive(
    node: TrieNode | null,
    key: Uint8Array,
    index: number,
    value: Uint8Array
  ): TrieNode {
    if (!node) {
      return new TrieNode(key, value);
    }

    if (index === key.length) {
      node.value = value;
      return node;
    }

    const currentByte = key[index];
    const childKey = key.slice(index, index + 1).toString();
    let child = node.children.get(childKey);
    if (!child) {
      child = new TrieNode(key.slice(index, index + 1), null);
      node.children.set(childKey, child);
    }
    child = this.insertRecursive(child, key, index + 1, value);
    node.children.set(childKey, child);
    return node;
  }

  get(key: Uint8Array): Uint8Array | null {
    return this.getRecursive(this.root, key, 0);
  }

  private getRecursive(
    node: TrieNode | null,
    key: Uint8Array,
    index: number
  ): Uint8Array | null {
    if (!node) {
      return null;
    }

    if (index === key.length) {
      return node.value;
    }

    const currentByte = key[index];
    const childKey = key.slice(index, index + 1).toString();
    const child = node.children.get(childKey);
    if (!child) {
      return null;
    }
    return this.getRecursive(child, key, index + 1);
  }

  getRootHash(): Uint8Array {
    return this.root ? this.hashNode(this.root) : new Uint8Array();
  }

  private hashNode(node: TrieNode): Uint8Array {
    const childHashes = Array.from(node.children.values()).map(this.hashNode);
    const childHashesBuffer = new Uint8Array(childHashes.flatMap(h => [...h]));
    const nodeData = new Uint8Array([...node.key, ...(node.value ?? [])]);
    return new Uint8Array(keccak256.digest([...nodeData, ...childHashesBuffer]));
  }
}