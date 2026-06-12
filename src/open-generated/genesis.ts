import { Account, Block, ChainConfig } from '../types';
import fs from 'fs';
import path from 'path';

export class GenesisBuilder {
  private accounts: Account[] = [];
  private chainConfig: ChainConfig = {
    chainId: 'openchain',
    blockTime: 10,
    gasLimit: 8000000,
    initialSupply: 1000000000
  };

  addAccount(account: Account) {
    this.accounts.push(account);
  }

  setChainConfig(config: ChainConfig) {
    this.chainConfig = config;
  }

  loadAccountsFromFile(filePath: string) {
    const accountsJson = JSON.parse(fs.readFileSync(path.join(__dirname, filePath), 'utf8'));
    this.accounts = accountsJson.map((acc: any) => ({
      address: acc.address,
      balance: acc.balance
    }));
  }

  build(): Block {
    return {
      blockNumber: 0,
      timestamp: Math.floor(Date.now() / 1000),
      transactions: [],
      accounts: this.accounts,
      config: this.chainConfig
    };
  }
}