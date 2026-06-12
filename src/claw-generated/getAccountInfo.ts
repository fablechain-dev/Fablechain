import { Connection, PublicKey, AccountInfo as SolanaAccountInfo } from '@solana/web3.js';

export interface AccountInfo {
  lamports: number;
  owner: string;
  executable: boolean;
}

export async function getAccountInfo(connection: Connection, pubkey: string): Promise<AccountInfo> {
  const publicKey = new PublicKey(pubkey);
  const accountInfo = await connection.getAccountInfo(publicKey);

  if (!accountInfo) {
    throw new Error(`Account not found for pubkey: ${pubkey}`);
  }

  return {
    lamports: accountInfo.lamports,
    owner: accountInfo.owner.toBase58(),
    executable: accountInfo.executable
  };
}