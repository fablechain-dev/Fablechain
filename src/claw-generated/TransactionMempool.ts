import { Transaction } from '../blockchain/Transaction';

export class TransactionMempool {
  private transactions: Transaction[] = [];

  addTransaction(tx: Transaction): void {
    // Check for duplicate transactions
    if (this.transactions.some(t => t.id === tx.id)) {
      return;
    }

    this.transactions.push(tx);
  }

  getTransactions(): Transaction[] {
    return this.transactions;
  }
}