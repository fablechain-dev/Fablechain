import { Account } from './Account';

export class AccountRegistry {
  private static registeredAccounts: { [address: string]: Account } = {};

  static registerAccount(account: Account): void {
    AccountRegistry.registeredAccounts[account.address] = account;
  }

  static getAccount(address: string): Account | undefined {
    return AccountRegistry.registeredAccounts[address];
  }
}