import { BigNumber } from 'ethers';
import StakingManager from './StakingManager';

describe('StakingManager', () => {
  let stakingManager: StakingManager;

  beforeEach(() => {
    stakingManager = new StakingManager();
  });

  it('should track delegations', async () => {
    await stakingManager.stake(BigNumber.from(1000), 'user1');
    await stakingManager.stake(BigNumber.from(500), 'user2');

    expect(stakingManager.delegations.get('user1')).toEqual(BigNumber.from(1000));
    expect(stakingManager.delegations.get('user2')).toEqual(BigNumber.from(500));
  });

  it('should allow withdrawals', async () => {
    await stakingManager.stake(BigNumber.from(1000), 'user1');
    await stakingManager.withdraw(BigNumber.from(500), 'user1');

    expect(stakingManager.delegations.get('user1')).toEqual(BigNumber.from(500));
  });

  it('should calculate rewards correctly', async () => {
    await stakingManager.stake(BigNumber.from(1000), 'user1');
    await stakingManager.stake(BigNumber.from(500), 'user2');

    const user1Rewards = await stakingManager.claimRewards('user1');
    const user2Rewards = await stakingManager.claimRewards('user2');

    expect(user1Rewards).toEqual(BigNumber.from(10));
    expect(user2Rewards).toEqual(BigNumber.from(5));
  });
});