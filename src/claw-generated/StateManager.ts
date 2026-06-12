import { Block } from '../blockchain/Block';
import { Account } from '../accounts/Account';

export class StateManager {
  private state: Map<string, Account> = new Map();

  applyBlockChanges(block: Block) {
    // Apply transactions to update the state
    for (const tx of block.transactions) {
      this.updateAccount(tx.from, tx);
      this.updateAccount(tx.to, tx);
    }
  }

  private updateAccount(address: string, tx: Transaction) {
    let account = this.state.get(address);
    if (!account) {
      account = new Account(address);
      this.state.set(address, account);
    }
    account.applyTransaction(tx);
  }

  getAccount(address: string): Account {
    return this.state.get(address) || new Account(address);
  }
}