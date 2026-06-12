import { Transaction } from './Transaction';
import { Account } from './Account';
import { Ed25519Signer } from './crypto/ed25519';

export class TransactionSigner {
  private accounts: Map<string, Account>;

  constructor(accounts: Map<string, Account>) {
    this.accounts = accounts;
  }

  signTransaction(tx: Transaction): Transaction {
    const senderAccount = this.accounts.get(tx.sender.publicKey.toString());
    if (senderAccount && senderAccount.validateTransaction(tx)) {
      tx.sign();
      return tx;
    } else {
      throw new Error('Invalid transaction');
    }
  }

  verifyTransaction(tx: Transaction): boolean {
    const senderAccount = this.accounts.get(tx.sender.publicKey.toString());
    return senderAccount && tx.verify();
  }
}