import { AbstractAccount } from './AbstractAccount';
import { Account } from './Account';

export class TransactionProcessor {
  static processTransaction(tx: Transaction) {
    // Check if the sender is an AbstractAccount
    if (tx.from instanceof AbstractAccount) {
      // Validate the transaction using the AbstractAccount's validate method
      if (!tx.from.validate(tx)) {
        throw new Error('Transaction validation failed');
      }
    } else if (tx.from instanceof Account) {
      // Use standard account validation
      if (!tx.from.validate(tx)) {
        throw new Error('Transaction validation failed');
      }
    } else {
      throw new Error('Invalid sender account type');
    }

    // Continue with normal transaction processing...
  }
}