import { Account, PublicKey } from '@clawchain/types';
import { getAccountData } from '../storage/accounts';

export async function getAccountInfo(pubkey: PublicKey): Promise<{
  lamports: number;
  owner: PublicKey;
  executable: boolean;
}> {
  const account = await getAccountData(pubkey);
  if (!account) {
    throw new Error(`Account not found for pubkey: ${pubkey.toString()}`);
  }

  return {
    lamports: account.lamports,
    owner: account.owner,
    executable: account.executable
  };
}