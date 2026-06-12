import { PublicKey } from '@solana/web3.js';
import { Account } from '../state/account';

export async function getAccountInfo(pubkey: PublicKey): Promise<{
  lamports: number;
  owner: PublicKey;
  executable: boolean;
}> {
  const account = await Account.getByPublicKey(pubkey);
  if (!account) {
    throw new Error(`Account not found for pubkey ${pubkey.toBase58()}`);
  }

  return {
    lamports: account.lamports,
    owner: account.owner,
    executable: account.executable,
  };
}