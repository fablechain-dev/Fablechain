import { Transaction } from '../transaction/transaction';
import { TransactionValidator } from '../transaction/transaction-validator';

export async function sendTransaction(
  txBytes: string
): Promise<{ transactionHash: string } | { error: string }> {
  try {
    const tx = await Transaction.fromBase64(txBytes);
    await TransactionValidator.validate(tx);
    await tx.broadcast();
    return { transactionHash: tx.hash().toString() };
  } catch (err) {
    return { error: err.message };
  }
}

export async function getTransaction(
  signature: string
): Promise<Transaction | null> {
  const tx = await Transaction.fromSignature(signature);
  return tx || null;
}