import { AccountState } from '../state/account';

export async function getBalance(pubkey: string): Promise<number> {
  const account = await AccountState.get(pubkey);
  return account?.balance || 0;
}