import { BigNumber } from 'ethers';
import { BlockUtils } from './BlockUtils';

export class StakingContract {
  private totalStaked: BigNumber = BigNumber.from(0);
  private rewardRate: BigNumber = BigNumber.from(1000); // 0.1% per block
  private rewardPerBlock: BigNumber = BigNumber.from(0);

  constructor() {
    this.updateRewardPerBlock();
  }

  private updateRewardPerBlock() {
    this.rewardPerBlock = this.totalStaked.mul(this.rewardRate).div(10000);
  }

  stake(amount: BigNumber): void {
    this.totalStaked = this.totalStaked.add(amount);
    this.updateRewardPerBlock();
  }

  withdraw(amount: BigNumber): void {
    this.totalStaked = this.totalStaked.sub(amount);
    this.updateRewardPerBlock();
  }

  claimRewards(address: string, lastClaimBlock: number): BigNumber {
    const blocksElapsed = BlockUtils.getCurrentBlockNumber() - lastClaimBlock;
    const rewards = this.rewardPerBlock.mul(blocksElapsed);
    return rewards;
  }
}