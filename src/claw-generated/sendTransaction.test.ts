import { sendTransaction } from '../api/rpc';

describe('sendTransaction', () => {
  it('should send a transaction with valid parameters', async () => {
    const txParams = {
      from: '0x1234567890abcdef',
      to: '0x0987654321fedcba',
      value: 1000,
      gas: 21000,
      gasPrice: 1000000000
    };
    const txHash = await sendTransaction(txParams);
    expect(txHash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('should throw an error for invalid transaction parameters', async () => {
    const invalidTxParams = {
      from: 'invalid-address',
      to: '0x0987654321fedcba',
      value: -1000,
      gas: 0,
      gasPrice: 0
    };
    await expect(sendTransaction(invalidTxParams)).rejects.toThrow();
  });
});