import { Address, Transaction } from '../types';

export interface Account {
  address: Address;
  validateTransaction(tx: Transaction): Promise<boolean>;
}

export class AccountManager {
  private accounts: Account[] = [];

  registerAccount(account: Account) {
    this.accounts.push(account);
  }

  async validateTransaction(tx: Transaction): Promise<boolean> {
    for (const account of this.accounts) {
      if (account.address === tx.from) {
        if (!(await account.validateTransaction(tx))) {
          return false;
        }
      }
    }
    return true;
  }
}