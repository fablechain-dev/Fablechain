import { MerklePatriciaTrie } from './MerklePatriciaTrie';

describe('MerklePatriciaTrie', () => {
  let trie: MerklePatriciaTrie;

  beforeEach(() => {
    trie = new MerklePatriciaTrie();
  });

  test('set and get', () => {
    trie.set('key1', 'value1');
    trie.set('key2', 'value2');
    trie.set('key3', 'value3');

    expect(trie.get('key1')).toBe('value1');
    expect(trie.get('key2')).toBe('value2');
    expect(trie.get('key3')).toBe('value3');
  });

  test('get non-existent key', () => {
    expect(trie.get('non-existent')).toBeUndefined();
  });

  test('generate and verify proof', () => {
    trie.set('key1', 'value1');
    trie.set('key2', 'value2');
    trie.set('key3', 'value3');

    const proof1 = trie.getProof('key1');
    const proof2 = trie.getProof('key2');
    const proof3 = trie.getProof('key3');

    expect(trie.verifyProof('key1', 'value1', proof1)).toBe(true);
    expect(trie.verifyProof('key2', 'value2', proof2)).toBe(true);
    expect(trie.verifyProof('key3', 'value3', proof3)).toBe(true);
  });

  test('verify invalid proof', () => {
    trie.set('key1', 'value1');
    trie.set('key2', 'value2');
    trie.set('key3', 'value3');

    const proof1 = trie.getProof('key1');
    expect(trie.verifyProof('key1', 'invalid-value', proof1)).toBe(false);
  });
});