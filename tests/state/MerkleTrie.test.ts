```typescript
import { MerkleTrie } from '../../src/state/MerkleTrie';
import { keccak256 } from 'ethers/lib/utils';
import { randomBytes } from 'crypto';

describe('MerkleTrie', () => {
  let trie: MerkleTrie;

  beforeEach(() => {
    trie = new MerkleTrie();
  });

  describe('insert', () => {
    it('should insert a single key-value pair', () => {
      const key = 'test-key-1';
      const value = 'test-value-1';

      trie.insert(key, value);

      expect(trie.get(key)).toBe(value);
    });

    it('should insert multiple key-value pairs', () => {
      const pairs = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
        { key: 'key3', value: 'value3' },
      ];

      pairs.forEach(({ key, value }) => {
        trie.insert(key, value);
      });

      pairs.forEach(({ key, value }) => {
        expect(trie.get(key)).toBe(value);
      });
    });

    it('should update existing key with new value', () => {
      const key = 'update-test';
      trie.insert(key, 'old-value');
      expect(trie.get(key)).toBe('old-value');

      trie.insert(key, 'new-value');
      expect(trie.get(key)).toBe('new-value');
    });

    it('should handle large binary data', () => {
      const key = 'binary-key';
      const largeValue = randomBytes(1024).toString('hex');

      trie.insert(key, largeValue);
      expect(trie.get(key)).toBe(largeValue);
    });

    it('should update merkle root after insertion', () => {
      const root1 = trie.getRoot();

      trie.insert('key1', 'value1');
      const root2 = trie.getRoot();

      expect(root1).not.toBe(root2);
    });

    it('should handle empty string keys and values', () => {
      trie.insert('', 'empty-key-value');
      expect(trie.get('')).toBe('empty-key-value');

      trie.insert('empty-value-key', '');
      expect(trie.get('empty-value-key')).toBe('');
    });
  });

  describe('get', () => {
    it('should retrieve inserted value', () => {
      trie.insert('key', 'value');
      expect(trie.get('key')).toBe('value');
    });

    it('should return null for non-existent key', () => {
      expect(trie.get('non-existent')).toBeNull();
    });

    it('should retrieve correct value among multiple entries', () => {
      for (let i = 0; i < 100; i++) {
        trie.insert(`key-${i}`, `value-${i}`);
      }

      expect(trie.get('key-50')).toBe('value-50');
      expect(trie.get('key-99')).toBe('value-99');
      expect(trie.get('key-0')).toBe('value-0');
    });

    it('should handle case sensitivity', () => {
      trie.insert('Key', 'value1');
      trie.insert('key', 'value2');

      expect(trie.get('Key')).toBe('value1');
      expect(trie.get('key')).toBe('value2');
    });

    it('should retrieve value after update', () => {
      trie.insert('key', 'original');
      trie.insert('key', 'updated');
      expect(trie.get('key')).toBe('updated');
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      trie.insert('key', 'value');
      expect(trie.get('key')).toBe('value');

      trie.delete('key');
      expect(trie.get('key')).toBeNull();
    });

    it('should handle deleting non-existent key gracefully', () => {
      expect(() => {
        trie.delete('non-existent');
      }).not.toThrow();
      expect(trie.get('non-existent')).toBeNull();
    });

    it('should update merkle root after deletion', () => {
      trie.insert('key1', 'value1');
      trie.insert('key2', 'value2');
      const root1 = trie.getRoot();

      trie.delete('key1');
      const root2 = trie.getRoot();

      expect(root1).not.toBe(root2);
    });

    it('should allow reinsertion after deletion', () => {
      trie.insert('key', 'value1');
      trie.delete('key');
      trie.insert('key', 'value2');

      expect(trie.get('key')).toBe('value2');
    });

    it('should delete one key without affecting others', () => {
      trie.insert('key1', 'value1');
      trie.insert('key2', 'value2');
      trie.insert('key3', 'value3');

      trie.delete('key2');

      expect(trie.get('key1')).toBe('value1');
      expect(trie.get('key2')).toBeNull();
      expect(trie.get('key3')).toBe('value3');
    });
  });

  describe('getRoot', () => {
    it('should return consistent root for same state', () => {
      trie.insert('key1', 'value1');
      trie.insert('key2', 'value2');

      const root1 = trie.getRoot();
      const root2 = trie.getRoot();

      expect(root1).toBe(root2);
    });

    it('should return different root for different insertions', () => {
      const trie1 = new MerkleTrie();
      const trie2 = new MerkleTrie();

      trie1.insert('key', 'value1');
      trie2.insert('key', 'value2');

      expect(trie1.getRoot()).not.toBe(trie2.getRoot());
    });

    it('should return different root for insertion order variations', () => {
      const trie1 = new MerkleTrie();
      const trie2 = new MerkleTrie();

      trie1.insert('a', '1');
      trie1.insert('b', '2');

      trie2.insert('b', '2');
      trie2.insert('a', '1');

      expect(trie1.getRoot()).toBe(trie2.getRoot());
    });

    it('should return standard hex format root', () => {
      trie.insert('key', 'value');
      const root = trie.getRoot();

      expect(typeof root).toBe('string');
      expect(root.match(/^0x[0-9a-f]{64}$/i)).not.toBeNull();
    });
  });

  describe('generateProof', () => {
    it('should generate proof for existing key', () => {
      trie.insert('key', 'value');
      const proof = trie.generateProof('key');

      expect(proof).toBeDefined();
      expect(Array.isArray(proof)).toBe(true);
      expect(proof.length).toBeGreaterThan(0);
    });

    it('should generate different proofs for different keys', () => {
      trie.insert('key1', 'value1');
      trie.insert('key2', 'value2');

      const proof1 = trie.generateProof('key1');
      const proof2 = trie.generateProof('key2');