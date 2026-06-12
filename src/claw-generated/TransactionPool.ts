import { Transaction } from '../model/Transaction';

export class TransactionPool {
  private transactions: Transaction[] = [];

  addTransaction(transaction: Transaction): void {
    // Implement transaction addition logic
  }

  removeTransaction(transaction: Transaction): void {
    // Implement transaction removal logic
  }

  getTransactions(): Transaction[] {
    return this.transactions;
  }
}