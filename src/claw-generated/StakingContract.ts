import { BigNumber } from 'ethers';

export class StakingContract {
  private stakedBalances: Map<string, BigNumber> = new Map();
  private rewardRatePerBlock: BigNumber;

  constructor(rewardRatePerBlock: BigNumber) {
    this.rewardRatePerBlock = rewardRatePerBlock;
  }

  stake(account: string, amount: BigNumber): void {
    const currentBalance = this.stakedBalances.get(account) || BigNumber.from(0);
    this.stakedBalances.set(account, currentBalance.add(amount));
  }

  withdraw(account: string, amount: BigNumber): void {
    const currentBalance = this.stakedBalances.get(account) || BigNumber.from(0);
    this.stakedBalances.set(account, currentBalance.sub(amount));
  }

  claimRewards(account: string): BigNumber {
    const currentBalance = this.stakedBalances.get(account) || BigNumber.from(0);
    const rewards = currentBalance.mul(this.rewardRatePerBlock);
    this.stakedBalances.set(account, currentBalance);
    return rewards;
  }
}