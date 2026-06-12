import { Block } from './block';

describe('Block', () => {
  describe('constructor', () => {
    it('should create a new block with the provided parameters', () => {
      const block = new Block(1, Date.now(), 'prevHash', [{ tx: 'test' }], 0);
      expect(block.version).toEqual(1);
      expect(block.timestamp).toBeGreaterThan(0);
      expect(block.previousHash).toEqual('prevHash');
      expect(block.transactions).toEqual([{ tx: 'test' }]);
      expect(block.nonce).toEqual(0);
      expect(block.hash).not.toEqual('');
    });
  });

  describe('calculateHash', () => {
    it('should calculate the correct hash for a block', () => {
      const block = new Block(1, Date.now(), 'prevHash', [{ tx: 'test' }], 0);
      const hash = block.calculateHash();
      expect(hash).not.toEqual('');
      expect(hash.length).toEqual(64);
    });
  });

  describe('isValid', () => {
    it('should return true for a valid block', () => {
      const block = new Block(1, Date.now(), 'prevHash', [{ tx: 'test' }], 0);
      expect(block.isValid()).toEqual(true);
    });
  });

  describe('serialize', () => {
    it('should serialize the block to a string', () => {
      const block = new Block(1, Date.now(), 'prevHash', [{ tx: 'test' }], 0);
      const serialized = block.serialize();
      expect(typeof serialized).toEqual('string');
      expect(serialized.length).toBeGreaterThan(0);
    });
  });
});