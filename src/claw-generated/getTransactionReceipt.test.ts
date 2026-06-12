import { getTransactionReceipt } from '../api/rpc';

describe('getTransactionReceipt', () => {
  it('should return a transaction receipt for a valid transaction hash', async () => {
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const receipt = await getTransactionReceipt(txHash);
    expect(receipt).toHaveProperty('transactionHash', txHash);
    expect(receipt).toHaveProperty('blockNumber');
    expect(receipt).toHaveProperty('status');
  });

  it('should throw an error for an invalid transaction hash', async () => {
    const invalidTxHash = 'invalid-tx-hash';
    await expect(getTransactionReceipt(invalidTxHash)).rejects.toThrow();
  });
});