import { Account, AccountData } from './Account';
import { ContractDeployment } from './ContractDeployer';
import { StakingConfig } from './StakingManager';
import { GovernanceConfig } from './GovernanceManager';

export interface GenesisBlockConfig {
  chainId: string;
  initialAccounts: AccountData[];
  initialTokenAllocations: {
    [address: string]: {
      [tokenAddress: string]: number;
    };
  };
  initialContractDeployments: ContractDeployment[];
  stakingConfig: StakingConfig;
  governanceConfig: GovernanceConfig;
  networkSettings: {
    bootstrapNodes: string[];
    consensusType: 'proof-of-stake' | 'proof-of-authority';
  };
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

  getInitialTokenAllocations(): { [address: string]: { [tokenAddress: string]: number } } {
    return this.config.initialTokenAllocations;
  }

  getInitialContractDeployments(): ContractDeployment[] {
    return this.config.initialContractDeployments;
  }

  getStakingConfig(): StakingConfig {
    return this.config.stakingConfig;
  }

  getGovernanceConfig(): GovernanceConfig {
    return this.config.governanceConfig;
  }

  getNetworkSettings(): {
    bootstrapNodes: string[];
    consensusType: 'proof-of-stake' | 'proof-of-authority';
  } {
    return this.config.networkSettings;
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