import { PublicKey, Transaction } from '@solana/web3.js';
import { TransactionReceipt } from '../transaction/TransactionReceipt';

interface GetTransactionParams {
  signature: string;
}

interface GetTransactionResult {
  transaction: Transaction;
  meta: TransactionReceipt;
}

export async function getTransaction(params: GetTransactionParams): Promise<GetTransactionResult | null> {
  // Fetch the transaction by signature from the blockchain state
  const transaction = await Transaction.findBySignature(params.signature);

  if (!transaction) {
    return null;
  }

  // Fetch the transaction receipt (metadata)
  const meta = await TransactionReceipt.findByTransactionId(transaction.id);

  return {
    transaction: transaction.toTransaction(),
    meta: meta.toTransactionReceipt()
  };
}