```typescript
import crypto from 'crypto';

export interface TrieNode {
  type: 'branch' | 'leaf' | 'extension';
  hash?: Buffer;
  children?: (TrieNode | null)[];
  key?: Buffer;
  value?: Buffer;
  dirty: boolean;
}

export interface ProofNode {
  nodeHash: Buffer;
  nodeData: Buffer;
  path: number[];
}

export interface MerkleProof {
  key: Buffer;
  value: Buffer | null;
  proof: ProofNode[];
  root: Buffer;
}

class MerkleTrie {
  private root: TrieNode | null;
  private nodeCache: Map<string, TrieNode>;
  private db: Map<string, Buffer>;
  private dirty: Set<string>;

  constructor() {
    this.root = null;
    this.nodeCache = new Map();
    this.db = new Map();
    this.dirty = new Set();
  }

  private hashNode(node: TrieNode): Buffer {
    if (node.hash && !node.dirty) {
      return node.hash;
    }

    let encoded: Buffer;

    if (node.type === 'leaf') {
      const keyEncoded = this.encodeKey(node.key!, true);
      encoded = Buffer.concat([
        Buffer.from([0]),
        keyEncoded,
        node.value!,
      ]);
    } else if (node.type === 'extension') {
      const keyEncoded = this.encodeKey(node.key!, false);
      const childHash = this.hashNode(node.children![0]!);
      encoded = Buffer.concat([
        Buffer.from([1]),
        keyEncoded,
        childHash,
      ]);
    } else {
      const childHashes = node.children!.map((child) =>
        child ? this.hashNode(child) : Buffer.alloc(0)
      );
      encoded = Buffer.concat([Buffer.from([2]), ...childHashes]);
    }

    const hash = crypto.createHash('sha256').update(encoded).digest();
    node.hash = hash;
    node.dirty = false;

    return hash;
  }

  private encodeKey(key: Buffer, isLeaf: boolean): Buffer {
    const nibbles = this.bufferToNibbles(key);
    const hex = isLeaf ? 0x20 : 0x00;

    if (nibbles.length % 2 === 0) {
      const result = Buffer.alloc(nibbles.length / 2 + 1);
      result[0] = hex;
      for (let i = 0; i < nibbles.length; i += 2) {
        result[i / 2 + 1] = (nibbles[i] << 4) | nibbles[i + 1];
      }
      return result;
    } else {
      const result = Buffer.alloc((nibbles.length + 1) / 2 + 1);
      result[0] = hex | 0x10 | nibbles[0];
      for (let i = 1; i < nibbles.length; i += 2) {
        result[(i + 1) / 2] = (nibbles[i] << 4) | nibbles[i + 1];
      }
      return result;
    }
  }

  private bufferToNibbles(buffer: Buffer): number[] {
    const nibbles: number[] = [];
    for (const byte of buffer) {
      nibbles.push((byte >> 4) & 0xf);
      nibbles.push(byte & 0xf);
    }
    return nibbles;
  }

  private getNibbles(buffer: Buffer): number[] {
    return this.bufferToNibbles(buffer);
  }

  private createLeafNode(key: Buffer, value: Buffer): TrieNode {
    return {
      type: 'leaf',
      key,
      value,
      dirty: true,
    };
  }

  private createExtensionNode(key: Buffer, child: TrieNode): TrieNode {
    return {
      type: 'extension',
      key,
      children: [child],
      dirty: true,
    };
  }

  private createBranchNode(): TrieNode {
    return {
      type: 'branch',
      children: Array(16).fill(null),
      dirty: true,
    };
  }

  insert(key: Buffer, value: Buffer): void {
    if (!this.root) {
      this.root = this.createLeafNode(key, value);
      this.root.dirty = true;
      return;
    }

    this.root = this.insertNode(this.root, this.getNibbles(key), value, 0);
    this.dirty.add('root');
  }

  private insertNode(
    node: TrieNode,
    keyNibbles: number[],
    value: Buffer,
    depth: number
  ): TrieNode {
    if (node.type === 'leaf') {
      const nodeKeyNibbles = this.getNibbles(node.key!);

      let commonLength = 0;
      while (
        commonLength < keyNibbles.length &&
        commonLength < nodeKeyNibbles.length &&
        keyNibbles[commonLength] === nodeKeyNibbles[commonLength]
      ) {
        commonLength++;
      }

      if (commonLength === nodeKeyNibbles.length && commonLength === keyNibbles.length) {
        node.value = value;
        node.dirty = true;
        return node;
      }

      const branch = this.createBranchNode();

      if (commonLength < nodeKeyNibbles.length) {
        const remainingKey = Buffer.from(nodeKeyNibbles.slice(commonLength));
        const leafNode = this.createLeafNode(remainingKey, node.value!);
        branch.children![nodeKeyNibbles[commonLength]] = leafNode;
      }

      if (commonLength < keyNibbles.length) {
        const remainingKey = Buffer.from(keyNibbles.slice(commonLength));
        const newLeaf = this.createLeafNode(remainingKey, value);
        branch.children![keyNibbles[commonLength]] = newLeaf;
      } else {
        branch.value = value;
      }

      if (commonLength > 0) {
        const extensionKey = Buffer.from(keyNibbles.slice(0, commonLength));
        return this.createExtensionNode(extensionKey, branch);
      }

      return branch;
    }

    if (node.type === 'extension') {
      const extensionKeyNibbles = this.getNibbles(node.key!);

      let commonLength = 0;
      while (
        commonLength < extensionKeyNibbles.length &&
        commonLength < keyNibbles.length &&
        extensionKeyNibbles[commonLength] === keyNibbles[commonLength]
      ) {
        commonLength++;
      }

      if (commonLength === 0) {
        const branch = this.createBranchNode();
        branch.children![extensionKeyNibbles[0]] = node;
        const remainingKey = Buffer.from(keyNibbles.slice(1));
        const newLeaf = this.createLeafNode(remainingKey, value);
        branch.children![keyNibbles[0]] = newLeaf;
        return branch;
      }

      if (commonLength === extensionKeyNibbles.length) {
        const childNode = node.children![0]!;
        const newChild = this.insertNode(
          childNode,
          keyNibbles.slice(commonLength),
          value,
          depth + commonLength
        );
        node.children![0] = newChild;
        node.dirty = true;
        return node;
      }

      const remainingExtensionKey = Buffer.from(
        extensionKeyNibbles.slice(commonLength)
      );
      const oldExtension = this.createExtensionNode(
        remainingExtensionKey,
        node.children![0]!
      );

      const branch = this.createBranchNode();