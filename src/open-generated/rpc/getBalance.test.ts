import { getBalance } from './getBalance';
import { Account } from '../state/account';

describe('getBalance', () => {
  it('returns 0 for non-existent account', () => {
    const balance = getBalance('non-existent-pubkey');
    expect(balance).toEqual(0);
  });

  it('returns the correct balance', () => {
    const pubkey = 'some-pubkey';
    const account = new Account(pubkey, 100);
    Account.set(pubkey, account);

    const balance = getBalance(pubkey);
    expect(balance).toEqual(100);
  });
});