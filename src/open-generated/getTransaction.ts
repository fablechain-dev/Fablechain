import { Transaction } from '../models/Transaction';

export async function getTransaction(signature: string): Promise<Transaction | null> {
  // Query the transaction storage and return the full transaction data
  const transaction = await Transaction.findBySignature(signature);
  return transaction || null;
}