import { MerklePatriciaTrie } from './merkle-patricia-trie';

describe('MerklePatriciaTrie', () => {
  let trie: MerklePatriciaTrie;

  beforeEach(() => {
    trie = new MerklePatriciaTrie();
  });

  it('should insert and retrieve values', () => {
    trie.insert('key1', 'value1');
    trie.insert('key2', 'value2');
    trie.insert('key3', 'value3');

    expect(trie.get('key1')).toBe('value1');
    expect(trie.get('key2')).toBe('value2');
    expect(trie.get('key3')).toBe('value3');
  });

  it('should delete values', () => {
    trie.insert('key1', 'value1');
    trie.insert('key2', 'value2');
    trie.insert('key3', 'value3');

    trie.delete('key2');

    expect(trie.get('key1')).toBe('value1');
    expect(trie.get('key2')).toBeNull();
    expect(trie.get('key3')).toBe('value3');
  });

  it('should create and verify proofs', () => {
    trie.insert('key1', 'value1');
    trie.insert('key2', 'value2');
    trie.insert('key3', 'value3');

    const proof1 = trie.createProof('key2');
    const proof2 = trie.createProof('key4');

    expect(trie.verifyProof('key2', proof1)).toBe(true);
    expect(trie.verifyProof('key4', proof2)).toBe(false);
  });
});