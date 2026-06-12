import { Transaction } from '../core/Transaction';

export abstract class AbstractAccount {
  address: string;
  balance: number;

  constructor(address: string) {
    this.address = address;
    this.balance = 0;
  }

  abstract validateTransaction(tx: Transaction): boolean;

  executeTransaction(tx: Transaction): void {
    if (this.validateTransaction(tx)) {
      this.balance -= tx.amount;
      // Update blockchain state
    }
  }
}