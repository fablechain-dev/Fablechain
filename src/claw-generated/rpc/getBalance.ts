import { PublicKey } from '@solana/web3.js';
import { Account } from '../state/Account';

interface GetBalanceParams {
  pubkey: string;
}

interface GetBalanceResult {
  lamports: number;
}

export async function getBalance(params: GetBalanceParams): Promise<GetBalanceResult> {
  const { pubkey } = params;
  const account = await Account.findByPublicKey(new PublicKey(pubkey));

  if (!account) {
    throw new Error(`Account not found for public key: ${pubkey}`);
  }

  return {
    lamports: account.lamports,
  };
}