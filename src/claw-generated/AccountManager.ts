import { Account, EOAAccount, SmartContractAccount } from './Account';
import { Address, Transaction } from './types';

export class AccountManager {
  private accounts: Account[] = [];

  registerAccount(account: Account) {
    this.accounts.push(account);
  }

  getAccount(address: Address): Account | undefined {
    return this.accounts.find(account => account.address === address);
  }

  async validateTransaction(tx: Transaction): Promise<boolean> {
    const senderAccount = this.getAccount(tx.from);
    if (!senderAccount) {
      return false;
    }

    return await senderAccount.validateTransaction(tx);
  }

  createAccount(address: Address, type: 'EOA' | 'SmartContract'): Account {
    let account: Account;
    if (type === 'EOA') {
      account = new EOAAccount(address);
    } else {
      account = new SmartContractAccount(address);
    }
    this.registerAccount(account);
    return account;
  }

  async getBalance(address: Address): Promise<bigint> {
    const account = this.getAccount(address);
    if (!account) {
      return BigInt(0);
    }
    return await account.getBalance();
  }
}