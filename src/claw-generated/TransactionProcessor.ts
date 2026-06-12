import { Account } from './Account';
import { Transaction } from './Transaction';

export class TransactionProcessor {
  processTransaction(tx: Transaction, accounts: Map<string, Account>): void {
    const senderAccount = accounts.get(tx.from);
    const receiverAccount = accounts.get(tx.to);

    if (!senderAccount || !receiverAccount) {
      throw new Error('Invalid transaction: sender or receiver account does not exist');
    }

    if (senderAccount.nonce !== tx.nonce) {
      throw new Error('Invalid transaction: incorrect nonce');
    }

    if (senderAccount.balance < tx.value) {
      throw new Error('Invalid transaction: insufficient funds');
    }

    senderAccount.balance -= tx.value;
    receiverAccount.balance += tx.value;
    senderAccount.nonce += 1;

    // Process storage slot updates
    this.processStorageSlots(tx, senderAccount, receiverAccount);

    accounts.set(tx.from, senderAccount);
    accounts.set(tx.to, receiverAccount);
  }

  processStorageSlots(tx: Transaction, senderAccount: Account, receiverAccount: Account): void {
    // TODO: Implement storage slot processing logic
  }
}