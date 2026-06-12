import { getBlock } from '../api/rpc';

describe('getBlock', () => {
  it('should return a block for a valid block number', async () => {
    const blockNumber = 1000;
    const block = await getBlock(blockNumber);
    expect(block).toHaveProperty('number', blockNumber);
    expect(block).toHaveProperty('transactions');
  });

  it('should throw an error for an invalid block number', async () => {
    const invalidBlockNumber = -1;
    await expect(getBlock(invalidBlockNumber)).rejects.toThrow();
  });

  it('should return the latest block', async () => {
    const latestBlock = await getBlock('latest');
    expect(latestBlock).toHaveProperty('number');
    expect(latestBlock.number).toBeGreaterThanOrEqual(0);
  });
});