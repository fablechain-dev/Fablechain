import { Transaction } from './Transaction';
import { verifySignature } from '../crypto/ed25519';

export class TransactionPool {
  private transactions: Transaction[] = [];

  addTransaction(tx: Transaction): boolean {
    // Verify transaction signature
    if (!verifySignature(tx.from, tx.signature, tx.toString())) {
      return false;
    }

    // If valid, add to the pool
    this.transactions.push(tx);
    return true;
  }

  getTransactions(): Transaction[] {
    return this.transactions;
  }
}