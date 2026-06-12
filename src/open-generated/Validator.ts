import { BigNumber } from 'ethers';
import { Stake } from './staking/Stake';

export class Validator {
  address: string;
  totalStaked: BigNumber = BigNumber.from(0);
  stakes: Stake[] = [];

  constructor(address: string) {
    this.address = address;
  }

  addStake(stake: Stake): void {
    this.stakes.push(stake);
    this.totalStaked = this.totalStaked.add(stake.amount);
  }

  removeStake(stake: Stake): void {
    const index = this.stakes.findIndex((s) => s.validator === stake.validator && s.amount.eq(stake.amount));
    if (index !== -1) {
      this.stakes.splice(index, 1);
      this.totalStaked = this.totalStaked.sub(stake.amount);
    }
  }

  getTotalStakedAmount(): BigNumber {
    return this.totalStaked;
  }
}