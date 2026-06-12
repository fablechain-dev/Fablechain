import { Address } from './types';

export class AccountStorage {
  private static instance: AccountStorage;
  private accountStorage: Map<Address, Map<string, any>> = new Map();

  private constructor() {
    // Initialize account storage
  }

  public static getInstance(): AccountStorage {
    if (!AccountStorage.instance) {
      AccountStorage.instance = new AccountStorage();
    }
    return AccountStorage.instance;
  }

  public async getBalance(address: Address): Promise<bigint> {
    // Look up and return account balance
    const accountData = this.accountStorage.get(address);
    if (accountData && accountData.has('balance')) {
      return BigInt(accountData.get('balance') as number);
    }
    return BigInt(0);
  }

  public async getStorageValue(address: Address, key: string): Promise<any> {
    const accountData = this.accountStorage.get(address);
    if (accountData && accountData.has(key)) {
      return accountData.get(key);
    }
    return null;
  }

  public async setStorageValue(address: Address, key: string, value: any): Promise<void> {
    let accountData = this.accountStorage.get(address);
    if (!accountData) {
      accountData = new Map();
      this.accountStorage.set(address, accountData);
    }
    accountData.set(key, value);
  }

  public async deleteStorageValue(address: Address, key: string): Promise<void> {
    const accountData = this.accountStorage.get(address);
    if (accountData) {
      accountData.delete(key);
    }
  }
}