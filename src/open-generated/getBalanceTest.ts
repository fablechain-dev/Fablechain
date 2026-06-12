import { getBalanceHandler } from './getBalance';
import { AccountStorage } from './AccountStorage';

describe('getBalanceHandler', () => {
  it('should return the correct balance for a funded account', async () => {
    const accountStorage = AccountStorage.getInstance();
    jest.spyOn(accountStorage, 'getBalance').mockResolvedValue(1000);
    const balance = await getBalanceHandler('funded-account-pubkey');
    expect(balance).toBe(1000);
  });

  it('should return 0 for an unfunded account', async () => {
    const accountStorage = AccountStorage.getInstance();
    jest.spyOn(accountStorage, 'getBalance').mockResolvedValue(0);
    const balance = await getBalanceHandler('unfunded-account-pubkey');
    expect(balance).toBe(0);
  });

  it('should throw an error for an invalid pubkey', async () => {
    const accountStorage = AccountStorage.getInstance();
    jest.spyOn(accountStorage, 'getBalance').mockRejectedValue(new Error('Invalid pubkey'));
    await expect(getBalanceHandler('invalid-pubkey')).rejects.toThrow('Invalid pubkey');
  });
});