import { Block } from './Block';

describe('Block', () => {
  it('should create a new block', () => {
    const block = new Block(1, Date.now(), [], 'prevHash');
    expect(block.version).toEqual(1);
    expect(block.timestamp).toBeLessThanOrEqual(Date.now());
    expect(block.transactions).toEqual([]);
    expect(block.previousHash).toEqual('prevHash');
    expect(block.hash).not.toEqual('');
  });

  it('should calculate the correct hash', () => {
    const block = new Block(1, Date.now(), [], 'prevHash');
    const expectedHash = block.calculateHash();
    expect(block.hash).toEqual(expectedHash);
  });

  it('should validate a valid block', () => {
    const block = new Block(1, Date.now(), [], 'prevHash');
    expect(block.isValid()).toEqual(true);
  });

  it('should serialize and deserialize a block', () => {
    const block = new Block(1, Date.now(), [], 'prevHash');
    const serializedBlock = block.serialize();
    const deserializedBlock = JSON.parse(serializedBlock) as Block;
    expect(deserializedBlock.version).toEqual(block.version);
    expect(deserializedBlock.timestamp).toEqual(block.timestamp);
    expect(deserializedBlock.transactions).toEqual(block.transactions);
    expect(deserializedBlock.previousHash).toEqual(block.previousHash);
    expect(deserializedBlock.hash).toEqual(block.hash);
  });
});