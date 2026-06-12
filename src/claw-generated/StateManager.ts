import { Account } from '../account/Account';
import { Block } from '../block/Block';
import { Transaction } from '../transaction/Transaction';

export class StateManager {
  private accounts: Map<string, Account> = new Map();
  private stateRoot: string = '';

  applyTransaction(tx: Transaction): void {
    const sender = this.getAccount(tx.from);
    const receiver = this.getAccount(tx.to);

    sender.balance -= tx.amount;
    receiver.balance += tx.amount;

    this.updateStateRoot();
  }

  applyBlock(block: Block): void {
    for (const tx of block.transactions) {
      this.applyTransaction(tx);
    }

    this.updateStateRoot();
  }

  getAccount(address: string): Account {
    if (!this.accounts.has(address)) {
      this.accounts.set(address, new Account(address, 0));
    }
    return this.accounts.get(address)!;
  }

  getStateRoot(): string {
    return this.stateRoot;
  }

  private updateStateRoot(): void {
    // TODO: Implement state root calculation
    this.stateRoot = 'abc123';
  }
}