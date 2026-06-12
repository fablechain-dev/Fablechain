import { PublicKey } from '@solana/web3.js';
import { Account } from './Account';

export class RPCMethods {
  public static async getAccountInfo(pubkey: string): Promise<Account | null> {
    // TODO: Implement getAccountInfo RPC
    // - Fetch account data from the ClawChain state
    // - Create an Account instance with the fetched data
    // - Return the Account instance or null if not found
    return null;
  }
}