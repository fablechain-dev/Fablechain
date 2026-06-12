import { getBlock } from '../getBlock';

describe('getBlock', () => {
  it('should return a block for a valid block hash', async () => {
    const block = await getBlock('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    expect(block).toEqual({
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      number: 123,
      timestamp: 1234567890,
      transactions: ['0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'],
      // other block properties
    });
  });

  it('should throw an error for an invalid block hash', async () => {
    await expect(getBlock('invalid_block_hash')).rejects.toThrow();
  });

  it('should return a block for a valid block number', async () => {
    const block = await getBlock(123);
    expect(block).toEqual({
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      number: 123,
      timestamp: 1234567890,
      transactions: ['0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'],
      // other block properties
    });
  });

  it('should throw an error for an invalid block number', async () => {
    await expect(getBlock(999999)).rejects.toThrow();
  });
});