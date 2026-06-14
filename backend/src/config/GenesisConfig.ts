```typescript
import { BigNumber } from 'ethers';

export interface ValidatorConfig {
  address: string;
  stake: BigNumber;
  commissionRate: number;
  name: string;
}

export interface ConsensusConfig {
  blockTime: number;
  maxBlockSize: number;
  minValidatorStake: BigNumber;
  maxValidators: number;
  validatorRotationHeight: number;
  slashingRate: number;
  jailDuration: number;
}

export interface ChainParameters {
  chainId: number;
  chainName: string;
  genesisTime: number;
  initialSupply: BigNumber;
  tokenSymbol: string;
  tokenDecimals: number;
  maxGasPerBlock: BigNumber;
  minGasPrice: BigNumber;
}

export interface StakingConfig {
  unbondingPeriod: number;
  lockupPeriod: number;
  rewardDistributionEpoch: number;
  maxCommissionRate: number;
  minCommissionRate: number;
}

export interface FableAllocation {
  category: string;
  address: string;
  amount: BigNumber;
  vestingSchedule?: VestingSchedule;
}

export interface VestingSchedule {
  startTime: number;
  endTime: number;
  cliffDuration: number;
  releaseFrequency: number;
}

export interface GovernanceConfig {
  votingPeriod: number;
  proposalThreshold: BigNumber;
  quorumPercentage: number;
  majorityPercentage: number;
  proposalDeposit: BigNumber;
}

export interface GenesisState {
  consensusConfig: ConsensusConfig;
  chainParameters: ChainParameters;
  stakingConfig: StakingConfig;
  governanceConfig: GovernanceConfig;
  validators: ValidatorConfig[];
  fableAllocations: FableAllocation[];
  accounts: Map<string, BigNumber>;
}

const TOTAL_SUPPLY = BigNumber.from('1000000000').mul(BigNumber.from(10).pow(18));
const VALIDATOR_STAKE_AMOUNT = BigNumber.from('100000').mul(BigNumber.from(10).pow(18));
const GENESIS_TIME = Math.floor(Date.now() / 1000);

const initialValidators: ValidatorConfig[] = [
  {
    address: '0x742d35Cc6634C0532925a3b844Bc5e8bfb2b8d8E',
    stake: VALIDATOR_STAKE_AMOUNT,
    commissionRate: 0.05,
    name: 'Fable Genesis Validator 1',
  },
  {
    address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    stake: VALIDATOR_STAKE_AMOUNT,
    commissionRate: 0.05,
    name: 'Fable Genesis Validator 2',
  },
  {
    address: '0x2546BcD3c84621e001FFF67D42F38D3D69E7D28d',
    stake: VALIDATOR_STAKE_AMOUNT,
    commissionRate: 0.05,
    name: 'Fable Genesis Validator 3',
  },
  {
    address: '0x5aAeb6053ba3EEdb6A475A1D94d06992b9Df4D5F',
    stake: VALIDATOR_STAKE_AMOUNT,
    commissionRate: 0.05,
    name: 'Fable Genesis Validator 4',
  },
];

const consensusConfig: ConsensusConfig = {
  blockTime: 6000,
  maxBlockSize: 5242880,
  minValidatorStake: BigNumber.from('50000').mul(BigNumber.from(10).pow(18)),
  maxValidators: 128,
  validatorRotationHeight: 10800,
  slashingRate: 0.05,
  jailDuration: 864000,
};

const chainParameters: ChainParameters = {
  chainId: 2048,
  chainName: 'Fablechain',
  genesisTime: GENESIS_TIME,
  initialSupply: TOTAL_SUPPLY,
  tokenSymbol: 'FABLE',
  tokenDecimals: 18,
  maxGasPerBlock: BigNumber.from('30000000'),
  minGasPrice: BigNumber.from('1000000000'),
};

const stakingConfig: StakingConfig = {
  unbondingPeriod: 2592000,
  lockupPeriod: 86400,
  rewardDistributionEpoch: 43200,
  maxCommissionRate: 0.2,
  minCommissionRate: 0.0,
};

const governanceConfig: GovernanceConfig = {
  votingPeriod: 604800,
  proposalThreshold: BigNumber.from('50000').mul(BigNumber.from(10).pow(18)),
  quorumPercentage: 40,
  majorityPercentage: 50,
  proposalDeposit: BigNumber.from('1000').mul(BigNumber.from(10).pow(18)),
};

const fableAllocations: FableAllocation[] = [
  {
    category: 'Validator Stakes',
    address: '0x0000000000000000000000000000000000000000',
    amount: VALIDATOR_STAKE_AMOUNT.mul(4),
  },
  {
    category: 'Community Reserve',
    address: '0x1111111111111111111111111111111111111111',
    amount: BigNumber.from('200000000').mul(BigNumber.from(10).pow(18)),
    vestingSchedule: {
      startTime: GENESIS_TIME,
      endTime: GENESIS_TIME + 7776000,
      cliffDuration: 2592000,
      releaseFrequency: 86400,
    },
  },
  {
    category: 'Team Allocation',
    address: '0x2222222222222222222222222222222222222222',
    amount: BigNumber.from('150000000').mul(BigNumber.from(10).pow(18)),
    vestingSchedule: {
      startTime: GENESIS_TIME,
      endTime: GENESIS_TIME + 31536000,
      cliffDuration: 7776000,
      releaseFrequency: 2592000,
    },
  },
  {
    category: 'Foundation Grant',
    address: '0x3333333333333333333333333333333333333333',
    amount: BigNumber.from('100000000').mul(BigNumber.from(10).pow(18)),
    vestingSchedule: {
      startTime: GENESIS_TIME,
      endTime: GENESIS_TIME + 15552000,
      cliffDuration: 1296000,
      releaseFrequency: 604800,
    },
  },
  {
    category: 'Ecosystem Growth',
    address: '0x4444444444444444444444444444444444444444',
    amount: BigNumber.from('250000000').mul(BigNumber.from(10).pow(18)),
  },
  {
    category: 'Strategic Partnerships',
    address: '0x5555555555555555555555555555555555555555',
    amount: BigNumber.from('150000000').mul(BigNumber.from(10).pow(18)),
    vestingSchedule: {
      startTime: GENESIS_TIME,
      endTime: GENESIS_TIME + 7776000,
      cliffDuration: 2592000,
      releaseFrequency: 604800,
    },
  },
  {
    category: 'Public Sale',
    address: '0x6666666666666666666666666666666666666666',
    amount: BigNumber.from('150000000').mul(BigNumber.from(10).pow(18)),
  },
];

export const genesisConfig: GenesisState = {
  consensusConfig,
  chainParameters,
  stakingConfig,
  governanceConfig,