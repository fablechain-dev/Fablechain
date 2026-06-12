import { keccak256 } from 'js-sha3';

export enum NodeType {
  Extension = 'extension',
  Branch = 'branch',
  Leaf = 'leaf',
}

interface TrieNode {
  type: NodeType;
  key: Buffer;
  value: Buffer | null;
  children: TrieNode[];
}

export class MerklePatriciaTrie {
  private root: TrieNode | null = null;

  constructor() {
    // Initialize the trie
  }

  public insert(key: string, value: Buffer): void {
    this.root = this.insertRecursive(this.root, Buffer.from(key, 'hex'), value);
  }

  private insertRecursive(
    node: TrieNode | null,
    key: Buffer,
    value: Buffer
  ): TrieNode {
    // Existing insert logic...
  }

  public delete(key: string): void {
    this.root = this.deleteRecursive(this.root, Buffer.from(key, 'hex'));
  }

  private deleteRecursive(node: TrieNode | null, key: Buffer): TrieNode | null {
    if (!node) {
      return null;
    }

    if (node.type === NodeType.Leaf) {
      if (node.key.equals(key)) {
        return null; // Delete the leaf node
      }
      return node; // Key not found, return the node
    }

    if (node.type === NodeType.Extension) {
      if (key.slice(0, node.key.length).equals(node.key)) {
        node.children[0] = this.deleteRecursive(
          node.children[0],
          key.slice(node.key.length)
        );
        if (!node.children[0]) {
          return null; // Delete the extension node if the child is null
        }
        return node;
      }
      return node; // Key not found, return the node
    }

    if (node.type === NodeType.Branch) {
      const index = key.readUInt8(0);
      node.children[index] = this.deleteRecursive(
        node.children[index],
        key.slice(1)
      );

      // Check if the branch node has only one non-null child
      let nonNullChildIndex = -1;
      let nonNullChildCount = 0;
      for (let i = 0; i < 16; i++) {
        if (node.children[i]) {
          nonNullChildIndex = i;
          nonNullChildCount++;
        }
      }

      if (nonNullChildCount === 1) {
        // Collapse the branch node into an extension node
        const child = node.children[nonNullChildIndex]!;
        if (child.type === NodeType.Leaf) {
          return child;
        }
        return {
          type: NodeType.Extension,
          key: Buffer.concat([Buffer.from([nonNullChildIndex]), child.key]),
          value: null,
          children: [child],
        };
      }

      return node;
    }

    throw new Error('Unexpected node type');
  }

  public get(key: string): Buffer | null {
    return this.getRecursive(this.root, Buffer.from(key, 'hex'));
  }

  private getRecursive(node: TrieNode | null, key: Buffer): Buffer | null {
    if (!node) {
      return null;
    }

    if (node.type === NodeType.Leaf) {
      if (node.key.equals(key)) {
        return node.value;
      }
      return null;
    }

    if (node.type === NodeType.Extension) {
      if (key.slice(0, node.key.length).equals(node.key)) {
        return this.getRecursive(node.children[0], key.slice(node.key.length));
      }
      return null;
    }

    if (node.type === NodeType.Branch) {
      const index = key.readUInt8(0);
      return this.getRecursive(node.children[index], key.slice(1));
    }

    throw new Error('Unexpected node type');
  }

  public generateProof(key: string): Buffer[] {
    // Implement proof generation
  }

  private hashNode(node: TrieNode): Buffer {
    // Implement node hashing
    return Buffer.from(keccak256(JSON.stringify(node)), 'hex');
  }
}