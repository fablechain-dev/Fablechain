import { keccak256 } from 'js-sha3';

export class MerklePatriciaTrie {
  private root: TrieNode | null = null;

  constructor() {
    // Initialize the trie
  }

  get isEmpty(): boolean {
    return this.root === null;
  }

  get(key: string): any {
    let node = this.root;
    for (let i = 0; i < key.length; i++) {
      const char = key[i];
      if (!node || !node.children.has(char)) {
        return null;
      }
      node = node.children.get(char)!;
    }
    return node?.value || null;
  }

  set(key: string, value: any): void {
    this.root = this.setRecursive(this.root, key, 0, value);
  }

  private setRecursive(node: TrieNode | null, key: string, index: number, value: any): TrieNode {
    if (!node) {
      node = { key: '', value: null, children: new Map(), isLeaf: false };
    }

    if (index === key.length) {
      node.value = value;
      node.isLeaf = true;
      return node;
    }

    const char = key[index];
    let child = node.children.get(char);
    if (!child) {
      child = { key: char, value: null, children: new Map(), isLeaf: false };
      node.children.set(char, child);
    }

    child = this.setRecursive(child, key, index + 1, value);
    node.children.set(char, child);
    return node;
  }

  delete(key: string): void {
    this.root = this.deleteRecursive(this.root, key, 0);
  }

  private deleteRecursive(node: TrieNode | null, key: string, index: number): TrieNode | null {
    if (!node) {
      return null;
    }

    if (index === key.length) {
      if (node.isLeaf) {
        node.value = null;
        node.isLeaf = false;
      }
      return node.children.size === 0 ? null : node;
    }

    const char = key[index];
    const child = node.children.get(char);
    if (!child) {
      return node;
    }

    const updatedChild = this.deleteRecursive(child, key, index + 1);
    node.children.set(char, updatedChild || new Map());

    if (updatedChild === null && !node.isLeaf && node.children.size === 0) {
      return null;
    }

    return node;
  }

  getRoot(): string {
    return this.root ? this.hashNode(this.root) : '';
  }

  prove(key: string): Array<any> {
    const proof: Array<any> = [];
    let node = this.root;
    let index = 0;

    while (node) {
      if (index === key.length) {
        if (node.isLeaf) {
          proof.push({ key: node.key, value: node.value });
        }
        break;
      }

      const char = key[index];
      const child = node.children.get(char);
      if (!child) {
        break;
      }

      proof.push({ key: child.key, value: child.value, children: this.hashChildren(child.children) });
      node = child;
      index++;
    }

    return proof;
  }

  verify(key: string, value: any, proof: Array<any>): boolean {
    let root = '';
    let node: TrieNode | null = null;

    for (const { key, value, children } of proof) {
      const newNode: TrieNode = { key, value, children: new Map(), isLeaf: value !== null };
      if (node) {
        const char = key[0];
        node.children.set(char, newNode);
      }
      node = newNode;
      root = this.hashNode(newNode);
    }

    return root === this.getRoot() && (node?.value === value || (node?.value === null && value === undefined));
  }

  private hashNode(node: TrieNode): string {
    return keccak256(JSON.stringify({
      key: node.key,
      value: node.value,
      children: this.hashChildren(node.children)
    }));
  }

  private hashChildren(children: Map<string, TrieNode>): Array<string> {
    return Array.from(children.values()).map(this.hashNode);
  }
}

interface TrieNode {
  key: string;
  value: any;
  children: Map<string, TrieNode>;
  isLeaf: boolean;
}