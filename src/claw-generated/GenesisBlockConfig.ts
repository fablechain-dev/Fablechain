import { Account, AccountData } from '../account/Account';

export interface GenesisBlockConfig {
  chainId: string;
  initialAccounts: AccountData[];
  initialParameters: {
    blockTime: number;
    blockReward: number;
    maxBlockSize: number;
  };
}

export class GenesisBlockConfigurator {
  private config: GenesisBlockConfig;

  constructor(config: GenesisBlockConfig) {
    this.config = config;
  }

  getChainId(): string {
    return this.config.chainId;
  }

  getInitialAccounts(): Account[] {
    return this.config.initialAccounts.map(data => new Account(data));
  }

  getInitialParameters(): {
    blockTime: number;
    blockReward: number;
    maxBlockSize: number;
  } {
    return this.config.initialParameters;
  }

  validate(): boolean {
    // Add validation logic here
    return true;
  }

  toJSON(): string {
    return JSON.stringify(this.config, null, 2);
  }
}