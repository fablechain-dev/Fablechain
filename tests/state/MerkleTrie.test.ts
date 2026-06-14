```typescript
import { MerkleTrie } from '../../src/state/MerkleTrie';
import { KeccakHash } from '../../src/crypto/KeccakHash';
import { Buffer } from 'buffer';

describe('MerkleTrie', () => {
  let trie: MerkleTrie;
  let keccak: KeccakHash;

  beforeEach(() => {
    keccak = new KeccakHash();
    trie = new MerkleTrie(keccak);
  });

  describe('insert and get operations', () => {
    it('should insert a single key-value pair and retrieve it', () => {
      const key = Buffer.from('test-key-1');
      const value = Buffer.from('test-value-1');

      trie.insert(key, value);
      const retrieved = trie.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should insert multiple key-value pairs independently', () => {
      const pairs = [
        { key: Buffer.from('key-a'), value: Buffer.from('value-a') },
        { key: Buffer.from('key-b'), value: Buffer.from('value-b') },
        { key: Buffer.from('key-c'), value: Buffer.from('value-c') },
      ];

      pairs.forEach(({ key, value }) => {
        trie.insert(key, value);
      });

      pairs.forEach(({ key, value }) => {
        expect(trie.get(key)).toEqual(value);
      });
    });

    it('should return null for non-existent keys', () => {
      trie.insert(Buffer.from('existing-key'), Buffer.from('value'));
      const result = trie.get(Buffer.from('non-existent-key'));

      expect(result).toBeNull();
    });

    it('should update value when inserting with existing key', () => {
      const key = Buffer.from('mutable-key');
      const value1 = Buffer.from('first-value');
      const value2 = Buffer.from('second-value');

      trie.insert(key, value1);
      expect(trie.get(key)).toEqual(value1);

      trie.insert(key, value2);
      expect(trie.get(key)).toEqual(value2);
    });

    it('should handle empty values', () => {
      const key = Buffer.from('empty-value-key');
      const value = Buffer.alloc(0);

      trie.insert(key, value);
      expect(trie.get(key)).toEqual(value);
    });

    it('should handle large values', () => {
      const key = Buffer.from('large-value-key');
      const value = Buffer.alloc(10000);
      for (let i = 0; i < value.length; i++) {
        value[i] = i % 256;
      }

      trie.insert(key, value);
      expect(trie.get(key)).toEqual(value);
    });
  });

  describe('delete operations', () => {
    it('should delete an existing key-value pair', () => {
      const key = Buffer.from('delete-test-key');
      const value = Buffer.from('delete-test-value');

      trie.insert(key, value);
      expect(trie.get(key)).toEqual(value);

      trie.delete(key);
      expect(trie.get(key)).toBeNull();
    });

    it('should not throw when deleting non-existent key', () => {
      const key = Buffer.from('non-existent-delete');

      expect(() => {
        trie.delete(key);
      }).not.toThrow();
    });

    it('should handle deletion of multiple keys', () => {
      const keys = [
        Buffer.from('key-1'),
        Buffer.from('key-2'),
        Buffer.from('key-3'),
      ];
      const value = Buffer.from('shared-value');

      keys.forEach((key) => {
        trie.insert(key, value);
      });

      keys.slice(0, 2).forEach((key) => {
        trie.delete(key);
      });

      expect(trie.get(keys[0])).toBeNull();
      expect(trie.get(keys[1])).toBeNull();
      expect(trie.get(keys[2])).toEqual(value);
    });

    it('should allow reinsertion after deletion', () => {
      const key = Buffer.from('reinsert-key');
      const value1 = Buffer.from('value-1');
      const value2 = Buffer.from('value-2');

      trie.insert(key, value1);
      trie.delete(key);
      trie.insert(key, value2);

      expect(trie.get(key)).toEqual(value2);
    });
  });

  describe('root hash computation', () => {
    it('should have consistent root hash for same data', () => {
      const key = Buffer.from('consistency-key');
      const value = Buffer.from('consistency-value');

      trie.insert(key, value);
      const root1 = trie.getRootHash();
      const root2 = trie.getRootHash();

      expect(root1).toEqual(root2);
    });

    it('should change root hash when data changes', () => {
      const key1 = Buffer.from('key-1');
      const key2 = Buffer.from('key-2');
      const value = Buffer.from('value');

      trie.insert(key1, value);
      const root1 = trie.getRootHash();

      trie.insert(key2, value);
      const root2 = trie.getRootHash();

      expect(root1).not.toEqual(root2);
    });

    it('should produce same root hash for equivalent tries', () => {
      const key = Buffer.from('equiv-key');
      const value = Buffer.from('equiv-value');

      const trie1 = new MerkleTrie(keccak);
      const trie2 = new MerkleTrie(keccak);

      trie1.insert(key, value);
      trie2.insert(key, value);

      expect(trie1.getRootHash()).toEqual(trie2.getRootHash());
    });

    it('should update root hash after deletion', () => {
      const key = Buffer.from('delete-hash-key');
      const value = Buffer.from('delete-hash-value');

      trie.insert(key, value);
      const root1 = trie.getRootHash();

      trie.delete(key);
      const root2 = trie.getRootHash();

      expect(root1).not.toEqual(root2);
    });
  });

  describe('proof generation', () => {
    it('should generate proof for existing key', () => {
      const key = Buffer.from('proof-key');
      const value = Buffer.from('proof-value');

      trie.insert(key, value);
      const proof = trie.generateProof(key);

      expect(proof).toBeDefined();
      expect(Array.isArray(proof)).toBe(true);
      expect(proof.length).toBeGreaterThan(0);
    });

    it('should generate proof containing root hash', () => {
      const key = Buffer.from('root-proof-key');
      const value = Buffer.from('root-proof-value');

      trie.insert(key, value);
      const root = trie.getRootHash();
      const proof = trie.generateProof(key);

      expect(proof[proof.length - 1]).toEqual(root);
    });

    it('should generate different proofs for different keys', () => {
      const key1 = Buffer.from('proof-key-1');
      const key2 = Buffer.from('proof-key-2');
      const value = Buffer.from('proof-value');

      trie.insert(key1, value);
      trie.insert(key2, value);

      const proof1 = trie.generateProof(key1);
      const proof2 = trie.generateProof(key2);

      expect(proof1