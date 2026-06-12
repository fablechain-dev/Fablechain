import { getBlock } from './rpc';
import { Block } from '../Block';

describe('getBlock', () => {
  it('should fetch a block by slot number', async () => {
    const block = await getBlock(123, {});
    expect(block).toBeInstanceOf(Block);
    expect(block.slot).toBe(123);
  });

  it('should apply the encoding option', async () => {
    const block = await getBlock(123, { encoding: 'binary' });
    expect(block.transactions[0].message).toBeInstanceOf(Uint8Array);

    const block2 = await getBlock(123, { encoding: 'json' });
    expect(block2.transactions[0].message).toBeInstanceOf(Object);
  });

  it('should apply the transaction details option', async () => {
    const block = await getBlock(123, { transactionDetails: 'partial' });
    expect(block.transactions[0]).toEqual({
      signature: expect.any(String),
      message: expect.any(Object)
    });

    const block2 = await getBlock(123, { transactionDetails: 'none' });
    expect(block2.transactions).toEqual([]);
  });
});