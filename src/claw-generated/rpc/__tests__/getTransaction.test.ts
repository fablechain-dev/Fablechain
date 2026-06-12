import { getTransaction } from '../getTransaction';

describe('getTransaction', () => {
  it('should return a transaction for a valid transaction hash', async () => {
    const tx = await getTransaction('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    expect(tx).toEqual({
      hash: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      blockNumber: 123,
      from: '0x1234567890abcdef',
      to: '0x0987654321fedcba',
      value: '100000000',
      gas: 21000,
      gasPrice: '1000000000',
      data: '0x0123456789abcdef',
      // other transaction properties
    });
  });

  it('should throw an error for an invalid transaction hash', async () => {
    await expect(getTransaction('invalid_tx_hash')).rejects.toThrow();
  });
});