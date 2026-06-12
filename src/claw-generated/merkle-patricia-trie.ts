import { keccak256 } from 'js-sha3';
import rlp from 'rlp';

class MerklePatriciaTrie {
  private root: TrieNode | null = null;

  constructor() {
    // Initialize the trie
  }

  insert(key: string, value: string): void {
    this.root = this.insertRecursive(this.root, this.encodeKey(key), value, 0);
  }

  private insertRecursive(
    node: TrieNode | null,
    encodedKey: string[],
    value: string,
    index: number
  ): TrieNode {
    if (!node) {
      return new TrieNode(encodedKey, value);
    }

    if (index === encodedKey.length) {
      node.value = value;
      return node;
    }

    const currentChar = encodedKey[index];
    let childNode = node.children[currentChar];
    if (!childNode) {
      childNode = new TrieNode(null, null);
      node.children[currentChar] = childNode;
    }

    childNode = this.insertRecursive(childNode, encodedKey, value, index + 1);
    node.children[currentChar] = childNode;
    return node;
  }

  get(key: string): string | null {
    return this.getRecursive(this.root, this.encodeKey(key), 0);
  }

  private getRecursive(
    node: TrieNode | null,
    encodedKey: string[],
    index: number
  ): string | null {
    if (!node) {
      return null;
    }

    if (index === encodedKey.length) {
      return node.value;
    }

    const currentChar = encodedKey[index];
    const childNode = node.children[currentChar];
    return this.getRecursive(childNode, encodedKey, index + 1);
  }

  delete(key: string): void {
    this.root = this.deleteRecursive(this.root, this.encodeKey(key), 0);
  }

  private deleteRecursive(
    node: TrieNode | null,
    encodedKey: string[],
    index: number
  ): TrieNode | null {
    if (!node) {
      return null;
    }

    if (index === encodedKey.length) {
      if (!node.value) {
        return null;
      }
      node.value = null;
      return node;
    }

    const currentChar = encodedKey[index];
    const childNode = node.children[currentChar];
    node.children[currentChar] = this.deleteRecursive(childNode, encodedKey, index + 1);

    if (!node.value && Object.keys(node.children).length === 0) {
      return null;
    }

    return node;
  }

  createProof(key: string): TrieProof {
    const proof: TrieNode[] = [];
    this.createProofRecursive(this.root, this.encodeKey(key), 0, proof);
    return new TrieProof(proof);
  }

  private createProofRecursive(
    node: TrieNode | null,
    encodedKey: string[],
    index: number,
    proof: TrieNode[]
  ): boolean {
    if (!node) {
      return false;
    }

    proof.push(node);

    if (index === encodedKey.length) {
      return node.value !== null;
    }

    const currentChar = encodedKey[index];
    const childNode = node.children[currentChar];
    return this.createProofRecursive(childNode, encodedKey, index + 1, proof);
  }

  verifyProof(key: string, proof: TrieProof): boolean {
    let node: TrieNode | null = null;
    for (const trieNode of proof.nodes) {
      node = this.verifyProofRecursive(node, trieNode, this.encodeKey(key), 0);
      if (!node) {
        return false;
      }
    }
    return node?.value !== null;
  }

  private verifyProofRecursive(
    node: TrieNode | null,
    proof: TrieNode,
    encodedKey: string[],
    index: number
  ): TrieNode | null {
    if (!node) {
      return proof;
    }

    if (index === encodedKey.length) {
      return proof.value === node.value ? node : null;
    }

    const currentChar = encodedKey[index];
    const childNode = node.children[currentChar];
    const proofChildNode = proof.children[currentChar];
    if (!childNode && !proofChildNode) {
      return proof;
    }
    if (!childNode || !proofChildNode) {
      return null;
    }

    const verifiedChildNode = this.verifyProofRecursive(
      childNode,
      proofChildNode,
      encodedKey,
      index + 1
    );
    if (!verifiedChildNode) {
      return null;
    }
    node.children[currentChar] = verifiedChildNode;
    return node;
  }

  private encodeKey(key: string): string[] {
    return rlp.encode(key).toString().split(',');
  }

  private hashNode(node: TrieNode): string {
    return keccak256(rlp.encode([node.key, node.value]));
  }
}

class TrieNode {
  key: string | null;
  value: string | null;
  children: { [key: string]: TrieNode };

  constructor(key: string | null, value: string | null) {
    this.key = key;
    this.value = value;
    this.children = {};
  }
}

class TrieProof {
  nodes: TrieNode[];

  constructor(nodes: TrieNode[]) {
    this.nodes = nodes;
  }
}