/**
 * Get the balance of an account in lamports.
 * @param pubkey The public key of the account to query
 * @param state The current state of the blockchain
 * @returns The balance of the account in lamports
 */
export async function getBalance(pubkey: string, state: State): Promise<number> {
  const account = state.getAccount(pubkey);
  return account ? account.balance : 0;
}