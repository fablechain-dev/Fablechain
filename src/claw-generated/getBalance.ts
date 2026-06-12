import { AccountStorage } from './AccountStorage';

export async function getBalanceHandler(pubkey: string): Promise&lt;number&gt; {
  const accountStorage = AccountStorage.getInstance();
  const balance = await accountStorage.getBalance(pubkey);
  return balance;
}