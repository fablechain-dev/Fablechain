import { Transaction } from '../transaction/transaction';

export function getTransactions(pubkey: string): Transaction[] {
  // Fetch all transactions associated with the given pubkey
  return Transaction.getAllForAddress(pubkey);
}