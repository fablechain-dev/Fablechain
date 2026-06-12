import { Transaction } from '../transaction/transaction';

export async function sendTransaction(
  txBytes: string
): Promise<string> {
  const tx = await Transaction.fromBase64(txBytes);
  await tx.verifySignatures();
  await tx.broadcast();
  return tx.hash().toString();
}

export async function getTransaction(
  signature: string
): Promise<Transaction | null> {
  const tx = await Transaction.fromSignature(signature);
  return tx || null;
}