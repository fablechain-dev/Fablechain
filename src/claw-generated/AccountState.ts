import { Account } from '../accounts/Account';

export class AccountState {
  private storage: Map<string, any> = new Map();

  get(account: Account, key: string): any {
    const accountKey = this.getAccountKey(account);
    return this.storage.get(accountKey + ':' + key);
  }

  set(account: Account, key: string, value: any): void {
    const accountKey = this.getAccountKey(account);
    this.storage.set(accountKey + ':' + key, value);
  }

  private getAccountKey(account: Account): string {
    return account.address;
  }
}