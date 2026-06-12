import { AbstractAccount } from './AbstractAccount';
import { Transaction } from './Transaction';

export class Account implements AbstractAccount {
  address: string;
  nonce: number = 0;

  constructor(address: string) {
    this.address = address;
  }

  validate(tx: Transaction): boolean {
    // Check that the transaction nonce is greater than the account nonce
    if (tx.nonce <= this.nonce) {
      return false;
    }

    // Implement standard account validation logic
    return true;
  }

  incrementNonce(): void {
    this.nonce++;
  }
}