import { getAccountInfo } from '../getAccountInfo';

describe('getAccountInfo', () => {
  it('should return account info for a valid address', async () => {
    const accountInfo = await getAccountInfo('0x1234567890abcdef');
    expect(accountInfo).toEqual({
      address: '0x1234567890abcdef',
      balance: '1000000000',
      nonce: 123,
      // other account properties
    });
  });

  it('should throw an error for an invalid address', async () => {
    await expect(getAccountInfo('invalid_address')).rejects.toThrow();
  });
});