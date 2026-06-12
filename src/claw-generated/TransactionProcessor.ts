import { AccountManager } from './AccountManager';
import { Transaction } from '../core/types';

export class TransactionProcessor {
  private accountManager: AccountManager;

  constructor(accountManager: AccountManager) {
    this.accountManager = accountManager;
  }

  async processTransaction(tx: Transaction): Promise<boolean> {
    if (!(await this.accountManager.validateTransaction(tx))) {
      return false;
    }

    // Other transaction processing logic...

    return true;
  }
}