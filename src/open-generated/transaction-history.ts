import { Transaction } from './transaction';

export class TransactionHistory {
  private transactions: Transaction[] = [];

  addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);
  }

  getTransactions(): Transaction[] {
    return this.transactions;
  }

  getPendingTransactions(): Transaction[] {
    return this.transactions.filter(tx => tx.status === 'pending');
  }

  getConfirmedTransactions(): Transaction[] {
    return this.transactions.filter(tx => tx.status === 'confirmed');
  }
}