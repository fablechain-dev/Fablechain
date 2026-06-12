import { Transaction } from './Transaction';

export class Account {
  address: string;
  balance: number;
  nonce: number; // Add nonce property

  constructor(address: string) {
    this.address = address;
    this.balance = 0;
    this.nonce = 0; // Initialize nonce to 0
  }

  validateTransaction(tx: Transaction): boolean {
    // Check that the transaction nonce is greater than the account nonce
    return tx.from === this.address && this.balance >= tx.amount && tx.nonce > this.nonce;
  }

  executeTransaction(tx: Transaction): void {
    if (this.validateTransaction(tx)) {
      this.balance -= tx.amount;
      this.nonce = tx.nonce; // Update the account nonce
      // Update blockchain state
    }
  }
}