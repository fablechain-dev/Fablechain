import { PublicKey } from '@solana/web3.js';
import { Account } from '../state/Account';

export async function getAccountInfo(pubkey: PublicKey): Promise&lt;{
  data: Uint8Array;
  lamports: number;
  owner: PublicKey;
  executable: boolean;
} | null&gt; {
  // Fetch account data from the state
  const account = await Account.findByPublicKey(pubkey);

  if (!account) {
    return null;
  }

  return {
    data: account.data,
    lamports: account.lamports,
    owner: account.owner,
    executable: account.executable
  };
}