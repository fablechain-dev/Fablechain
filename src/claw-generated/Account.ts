import { Transaction } from '../core/Transaction';

export class Account {
  address: string;
  balance: number;

  constructor(address: string) {
    this.address = address;
    this.balance = 0;
  }

  validateTransaction(tx: Transaction): boolean {
    // Default validation logic
    return tx.from === this.address && this.balance >= tx.amount;
  }

  executeTransaction(tx: Transaction): void {
    if (this.validateTransaction(tx)) {
      this.balance -= tx.amount;
      // Update blockchain state
    }
  }
}