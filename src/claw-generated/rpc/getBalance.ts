import { Account } from '../state/account';

export function getBalance(pubkey: string): number {
  const account = Account.get(pubkey);
  if (!account) {
    return 0;
  }
  return account.balance;
}