import { getTransaction } from '../api/rpc';

describe('getTransaction', () => {
  it('should return a transaction for a valid transaction hash', async () => {
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const tx = await getTransaction(txHash);
    expect(tx).toHaveProperty('hash', txHash);
    expect(tx).toHaveProperty('from');
    expect(tx).toHaveProperty('to');
  });

  it('should throw an error for an invalid transaction hash', async () => {
    const invalidTxHash = 'invalid-tx-hash';
    await expect(getTransaction(invalidTxHash)).rejects.toThrow();
  });
});