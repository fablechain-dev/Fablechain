import { Block } from './Block';
import { BlockHeader } from '../blockchain/BlockHeader';
import { Transaction } from '../blockchain/Transaction';

describe('Block', () => {
  describe('constructor', () => {
    it('should create a new block with the provided header and transactions', () => {
      const header = new BlockHeader({
        parentHash: '0x1234',
        timestamp: 1234567890,
        difficulty: 1,
        nonce: 0,
      });
      const transactions = [
        new Transaction({
          from: '0x0001',
          to: '0x0002',
          value: 100,
          data: '0x1234',
        }),
      ];

      const block = new Block(header, transactions);

      expect(block.header).toEqual(header);
      expect(block.transactions).toEqual(transactions);
      expect(block.hash).not.toBeEmpty();
    });
  });

  describe('isValid', () => {
    it('should return true for a valid block', () => {
      const header = new BlockHeader({
        parentHash: '0x1234',
        timestamp: 1234567890,
        difficulty: 1,
        nonce: 0,
      });
      const transactions = [
        new Transaction({
          from: '0x0001',
          to: '0x0002',
          value: 100,
          data: '0x1234',
        }),
      ];

      const block = new Block(header, transactions);

      expect(block.isValid()).toBe(true);
    });
  });

  describe('serialize', () => {
    it('should serialize the block to a string', () => {
      const header = new BlockHeader({
        parentHash: '0x1234',
        timestamp: 1234567890,
        difficulty: 1,
        nonce: 0,
      });
      const transactions = [
        new Transaction({
          from: '0x0001',
          to: '0x0002',
          value: 100,
          data: '0x1234',
        }),
      ];

      const block = new Block(header, transactions);
      const serializedBlock = block.serialize();

      expect(typeof serializedBlock).toBe('string');
    });
  });

  describe('deserialize', () => {
    it('should deserialize a block from a string', () => {
      const header = new BlockHeader({
        parentHash: '0x1234',
        timestamp: 1234567890,
        difficulty: 1,
        nonce: 0,
      });
      const transactions = [
        new Transaction({
          from: '0x0001',
          to: '0x0002',
          value: 100,
          data: '0x1234',
        }),
      ];

      const block = new Block(header, transactions);
      const serializedBlock = block.serialize();
      const deserializedBlock = Block.deserialize(serializedBlock);

      expect(deserializedBlock).toEqual(block);
    });
  });
});