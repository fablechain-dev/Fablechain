import { Transaction } from './Transaction';
import { Account } from './Account';

export class TransactionSigner {
  private accounts: Map<string, Account>;

  constructor(accounts: Map<string, Account>) {
    this.accounts = accounts;
  }

  signTransaction(tx: Transaction): Transaction {
    const senderAccount = this.accounts.get(tx.from);
    if (senderAccount && senderAccount.validateTransaction(tx)) {
      // Sign the transaction with the sender's private key
      // Update the transaction nonce
      tx.nonce = senderAccount.nonce;
      return tx;
    } else {
      throw new Error('Invalid transaction');
    }
  }
}