import { StakingManager } from './staking';

class Chain {
  private stakingManager: StakingManager;

  constructor() {
    this.stakingManager = new StakingManager();
  }

  async stake(amount: BigNumber, delegatee: string): Promise<void> {
    await this.stakingManager.stake(amount, delegatee);
  }

  async withdraw(amount: BigNumber, delegatee: string): Promise<void> {
    await this.stakingManager.withdraw(amount, delegatee);
  }

  async claimRewards(delegatee: string): Promise<BigNumber> {
    return await this.stakingManager.claimRewards(delegatee);
  }
}

export default Chain;