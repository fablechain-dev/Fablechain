import { getBalance } from '../api/rpc';

describe('getBalance', () => {
  it('should return the balance for a valid address', async () => {
    const address = '0x1234567890abcdef';
    const balance = await getBalance(address);
    expect(balance).toBeGreaterThanOrEqual(0);
  });

  it('should throw an error for an invalid address', async () => {
    const invalidAddress = 'invalid-address';
    await expect(getBalance(invalidAddress)).rejects.toThrow();
  });
});