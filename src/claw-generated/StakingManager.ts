import { BigNumber } from 'ethers';
import { StakingContract } from './StakingContract';
import { BlockUtils } from './BlockUtils';

export class StakingManager {
  private stakingContract: StakingContract;
  private userStakes: Map<string, BigNumber> = new Map();
  private lastClaimBlock: Map<string, number> = new Map();

  constructor(stakingContract: StakingContract) {
    this.stakingContract = stakingContract;
  }

  stake(address: string, amount: BigNumber): void {
    this.stakingContract.stake(amount);
    this.userStakes.set(address, (this.userStakes.get(address) || BigNumber.from(0)).add(amount));
    this.lastClaimBlock.set(address, BlockUtils.getCurrentBlockNumber());
  }

  withdraw(address: string, amount: BigNumber): void {
    this.stakingContract.withdraw(amount);
    const currentStake = this.userStakes.get(address) || BigNumber.from(0);
    this.userStakes.set(address, currentStake.sub(amount));
  }

  claimRewards(address: string): BigNumber {
    const stake = this.userStakes.get(address) || BigNumber.from(0);
    const lastClaim = this.lastClaimBlock.get(address) || 0;
    const rewards = this.stakingContract.claimRewards(address, lastClaim);
    this.lastClaimBlock.set(address, BlockUtils.getCurrentBlockNumber());
    return rewards;
  }
}