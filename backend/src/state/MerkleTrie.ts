```typescript
import crypto from 'crypto';

interface TrieNode {
  nodeType: 'branch' | 'leaf' | 'extension';
  children?: Map<string, TrieNode | string>; // For branch nodes, maps nibble to child or hash
  key?: string; // For leaf/extension nodes
  value?: string; // For leaf nodes only
  hash?: string; // Cached hash of this node
}

interface Proof {
  nodes: string[];
  indices: number[];
}

interface VerifyResult {
  valid: boolean;
  value?: string;
}

export class MerkleTrie {
  private root: TrieNode | null = null;
  private nodeCache: Map<string, TrieNode> = new Map();
  private hashCache: Map<TrieNode, string> = new Map();

  constructor() {
    this.root = this.createBranchNode();
  }

  /**
   * Insert a key-value pair into the trie
   */
  public insert(key: string, value: string): void {
    this.validateInput(key, value);
    const nibbles = this.keyToNibbles(key);

    if (!this.root) {
      this.root = this.createBranchNode();
    }

    this.root = this.insertNode(this.root, nibbles, value, 0);
    this.hashCache.clear();
  }

  /**
   * Retrieve value for a given key
   */
  public get(key: string): string | null {
    const nibbles = this.keyToNibbles(key);
    if (!this.root) return null;

    const result = this.getNode(this.root, nibbles, 0);
    return result;
  }

  /**
   * Delete a key from the trie
   */
  public delete(key: string): boolean {
    const nibbles = this.keyToNibbles(key);
    if (!this.root) return false;

    const [deleted, newRoot] = this.deleteNode(this.root, nibbles, 0);
    if (deleted) {
      this.root = newRoot;
      this.hashCache.clear();
      this.nodeCache.clear();
    }
    return deleted;
  }

  /**
   * Get the root hash of the trie (world-state root)
   */
  public getRootHash(): string {
    if (!this.root) {
      return this.hashEmpty();
    }
    return this.hashNode(this.root);
  }

  /**
   * Generate a Merkle proof for a key
   */
  public prove(key: string): Proof {
    const nibbles = this.keyToNibbles(key);
    const nodes: string[] = [];
    const indices: number[] = [];

    this.proveNode(this.root, nibbles, 0, nodes, indices);

    return { nodes, indices };
  }

  /**
   * Verify a Merkle proof against a root hash
   */
  public verify(
    rootHash: string,
    key: string,
    proof: Proof,
    expectedValue: string
  ): VerifyResult {
    const nibbles = this.keyToNibbles(key);
    let currentHash = rootHash;

    if (proof.nodes.length === 0) {
      return { valid: false };
    }

    for (let i = 0; i < proof.nodes.length; i++) {
      const nodeData = proof.nodes[i];
      const index = proof.indices[i];

      try {
        const reconstructed = this.reconstructHash(
          nodeData,
          index,
          currentHash
        );
        currentHash = reconstructed;
      } catch {
        return { valid: false };
      }
    }

    const finalLeaf = proof.nodes[proof.nodes.length - 1];
    const leafData = JSON.parse(finalLeaf);

    if (
      leafData.nodeType === 'leaf' &&
      leafData.value === expectedValue
    ) {
      return { valid: true, value: expectedValue };
    }

    return { valid: false };
  }

  /**
   * Serialize trie to JSON for persistence
   */
  public serialize(): string {
    return JSON.stringify(this.nodeToJSON(this.root));
  }

  /**
   * Deserialize trie from JSON
   */
  public deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.root = this.jsonToNode(parsed);
    this.hashCache.clear();
  }

  // ============ Private Methods ============

  private createBranchNode(): TrieNode {
    return {
      nodeType: 'branch',
      children: new Map(),
    };
  }

  private keyToNibbles(key: string): string[] {
    return key.split('').flatMap((char) => {
      const hex = char.charCodeAt(0).toString(16).padStart(2, '0');
      return [hex[0], hex[1]];
    });
  }

  private nibblesToKey(nibbles: string[]): string {
    let result = '';
    for (let i = 0; i < nibbles.length; i += 2) {
      const hex = nibbles[i] + nibbles[i + 1];
      result += String.fromCharCode(parseInt(hex, 16));
    }
    return result;
  }

  private insertNode(
    node: TrieNode | string,
    nibbles: string[],
    value: string,
    depth: number
  ): TrieNode {
    if (typeof node === 'string') {
      const cachedNode = this.nodeCache.get(node);
      if (!cachedNode) throw new Error(`Invalid node reference: ${node}`);
      return this.insertNode(cachedNode, nibbles, value, depth);
    }

    if (depth === nibbles.length) {
      if (node.nodeType === 'leaf') {
        node.value = value;
        return node;
      }

      if (node.nodeType === 'branch') {
        return {
          nodeType: 'leaf',
          key: this.nibblesToKey(nibbles),
          value,
        };
      }

      if (node.nodeType === 'extension') {
        const extNibbles = this.keyToNibbles(node.key || '');
        if (this.nibbleArraysEqual(extNibbles, nibbles.slice(depth))) {
          return node;
        }
        return this.splitExtensionNode(node, nibbles, value, depth);
      }
    }

    if (node.nodeType === 'branch') {
      const nibble = nibbles[depth];
      const child = node.children!.get(nibble);

      if (!child) {
        const newLeaf: TrieNode = {
          nodeType: 'leaf',
          key: this.nibblesToKey(nibbles.slice(depth + 1)),
          value,
        };
        node.children!.set(nibble, newLeaf);
      } else {
        const updated = this.insertNode(child, nibbles, value, depth + 1);
        node.children!.set(nibble, updated);
      }
      return node;
    }

    if (node.nodeType === 'extension') {
      const extNibbles = this.keyToNibbles(node.key || '');
      const commonLength = this.commonPrefixLength(
        extNibbles,
        nibbles.slice(depth)
      );

      if (commonLength === extNibbles.length) {
        const child = node.children!.get('next');
        if (child) {
          const updated = this.insertNode(
            child,
            nibbles,
            value,
            depth + extNibbles.length
          );
          node.children!.set('next', updated);
        }
        return node;
      }

      return this.splitExtensionNode(node, nibbles, value, depth);
    }

    if (node.nodeType === 'leaf') {
      const leafNibbles = this.keyToNibbles(node.key || '');
      const commonLength = this.