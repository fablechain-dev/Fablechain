import { Transaction } from './Transaction';
import { Account } from './Account';

export class RPCMethods {
  async simulateTransaction(tx: Transaction): Promise<boolean> {
    // Verify the transaction signature using the Account
    if (!tx.verify()) {
      return false;
    }

    // Apply the transaction to the simulated state
    // ...

    return true;
  }

  async sendTransaction(senderAccount: Account, recipient: string, amount: number): Promise<Transaction> {
    const tx = new Transaction(senderAccount, recipient, amount);
    await tx.sign();
    // Add the transaction to the mempool
    // ...
    return tx;
  }
}