import { BigNumber } from 'ethers';

export interface Stake {
  validator: string;
  amount: BigNumber;
  timestamp: number;
  rewards: BigNumber;
}