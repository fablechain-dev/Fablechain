import { Account } from './Account';
import { Transaction } from './Transaction';

export class TransactionProcessor {
  private accounts: Map<string, Account>;

  constructor(accounts: Map<string, Account>) {
    this.accounts = accounts;
  }

  processTransaction(tx: Transaction): void {
    const senderAccount = this.accounts.get(tx.from);
    if (senderAccount && senderAccount.validateTransaction(tx)) {
      senderAccount.executeTransaction(tx);
      // Update blockchain state
    } else {
      // Reject invalid transaction
    }
  }
}