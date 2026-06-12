import { BigNumber } from 'ethers';
import { Stake } from './Stake';
import { Validator } from '../Validator';
import { Block } from '../Block';

export class StakingManager {
  private stakes: Map<string, Stake[]> = new Map();
  private validators: Map<string, Validator> = new Map();

  constructor(validators: Validator[]) {
    for (const validator of validators) {
      this.validators.set(validator.address, validator);
    }
  }

  async stake(address: string, amount: BigNumber, validatorAddress: string): Promise<void> {
    const validator = this.validators.get(validatorAddress);
    if (!validator) {
      throw new Error(`Validator ${validatorAddress} not found`);
    }

    const stake: Stake = {
      validator: validatorAddress,
      amount,
      timestamp: Date.now(),
      rewards: BigNumber.from(0),
    };

    if (!this.stakes.has(address)) {
      this.stakes.set(address, []);
    }
    this.stakes.get(address)!.push(stake);

    validator.addStake(stake);
  }

  async withdraw(address: string, amount: BigNumber): Promise<void> {
    const stakes = this.stakes.get(address);
    if (!stakes || stakes.length === 0) {
      throw new Error(`No stakes found for address ${address}`);
    }

    let remainingAmount = amount;
    for (const stake of stakes) {
      if (stake.amount.lte(remainingAmount)) {
        remainingAmount = remainingAmount.sub(stake.amount);
        this.removeStake(address, stake);
      } else {
        stake.amount = stake.amount.sub(remainingAmount);
        this.validators.get(stake.validator)!.removeStake(stake);
        remainingAmount = BigNumber.from(0);
        break;
      }
    }

    if (remainingAmount.gt(0)) {
      throw new Error(`Insufficient staked amount for withdrawal`);
    }
  }

  private removeStake(address: string, stake: Stake): void {
    const stakes = this.stakes.get(address);
    if (stakes) {
      const index = stakes.findIndex((s) => s.validator === stake.validator && s.amount.eq(stake.amount));
      if (index !== -1) {
        stakes.splice(index, 1);
        this.validators.get(stake.validator)!.removeStake(stake);
      }
    }
  }

  async updateRewards(block: Block): Promise<void> {
    for (const [address, stakes] of this.stakes) {
      for (const stake of stakes) {
        const validator = this.validators.get(stake.validator);
        if (validator) {
          const rewardAmount = this.calculateRewards(stake, validator, block);
          stake.rewards = stake.rewards.add(rewardAmount);
          block.addStake(address, stake);
        }
      }
    }
  }

  private calculateRewards(stake: Stake, validator: Validator, block: Block): BigNumber {
    // Implement reward calculation logic based on staked amount, validator performance, etc.
    return BigNumber.from(0);
  }
}