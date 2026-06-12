import { Account } from '../models/Account';

export class StateManager {
  private state: Map<string, Account> = new Map();
  private stateHistory: Array<Map<string, Account>> = [];

  constructor() {
    // Initialize state
  }

  getAccount(address: string): Account {
    return this.state.get(address) || new Account();
  }

  updateAccount(address: string, account: Account): void {
    this.state.set(address, account);
    this.recordStateUpdate();
  }

  getStateRoot(): string {
    // Calculate state root hash
    return '';
  }

  applyTransaction(tx: Transaction): void {
    // Apply transaction to state
    this.recordStateUpdate();
  }

  recordStateUpdate(): void {
    // Create a copy of the current state and add it to the history
    this.stateHistory.push(new Map(this.state));
  }

  getStateDiff(fromHeight: number, toHeight: number): Map<string, Account> {
    // Calculate the state diff between the two block heights
    const fromState = this.stateHistory[fromHeight];
    const toState = this.stateHistory[toHeight];
    const diff = new Map();

    for (const [address, account] of toState) {
      const prevAccount = fromState.get(address);
      if (!prevAccount || !account.equals(prevAccount)) {
        diff.set(address, account);
      }
    }

    return diff;
  }
}