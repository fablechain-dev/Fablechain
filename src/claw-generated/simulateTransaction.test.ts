import { simulateTransaction } from '../api/rpc';

describe('simulateTransaction', () => {
  it('should simulate a transaction with valid parameters', async () => {
    const txParams = {
      from: '0x1234567890abcdef',
      to: '0x0987654321fedcba',
      value: 1000,
      gas: 21000,
      gasPrice: 1000000000
    };
    const result = await simulateTransaction(txParams);
    expect(result).toHaveProperty('gasUsed');
    expect(result).toHaveProperty('status');
  });

  it('should throw an error for invalid transaction parameters', async () => {
    const invalidTxParams = {
      from: 'invalid-address',
      to: '0x0987654321fedcba',
      value: -1000,
      gas: 0,
      gasPrice: 0
    };
    await expect(simulateTransaction(invalidTxParams)).rejects.toThrow();
  });
});