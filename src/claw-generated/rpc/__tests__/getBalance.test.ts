import { getBalance } from '../getBalance';

describe('getBalance', () => {
  it('should return the balance for a valid address', async () => {
    const balance = await getBalance('0x1234567890abcdef');
    expect(balance).toBe('1000000000');
  });

  it('should throw an error for an invalid address', async () => {
    await expect(getBalance('invalid_address')).rejects.toThrow();
  });
});