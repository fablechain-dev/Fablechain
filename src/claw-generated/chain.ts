import { Account } from './account';
import { ExternallyOwnedAccount } from './externallyOwnedAccount';
import { SmartContractAccount } from './smartContractAccount';

export class Chain {
  private accounts: Map&lt;string, Account&gt; = new Map();

  addAccount(account: Account): void {
    this.accounts.set(account.getAddress(), account);
  }

  getAccount(address: string): Account {
    return this.accounts.get(address)!;
  }

  async processTransaction(tx: Transaction): Promise&lt;void&gt; {
    const senderAccount = this.getAccount(tx.from);
    if (senderAccount.validateTransaction(tx)) {
      await senderAccount.execute(tx);
    } else {
      throw new Error('Invalid transaction');
    }
  }
}