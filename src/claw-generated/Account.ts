import { AccountState } from './AccountState';

export class Account {
  address: string;
  balance: number;
  state: AccountState;

  constructor(address: string) {
    this.address = address;
    this.balance = 0;
    this.state = new AccountState();
  }

  getState(key: string): any {
    return this.state.get(this, key);
  }

  setState(key: string, value: any): void {
    this.state.set(this, key, value);
  }
}