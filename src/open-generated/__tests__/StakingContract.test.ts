import { BigNumber } from 'ethers';
import { StakingContract } from '../StakingContract';

describe('StakingContract', () => {
  let stakingContract: StakingContract;

  beforeEach(() => {
    stakingContract = new StakingContract(BigNumber.from(10));
  });

  it('should stake and withdraw correctly', () => {
    stakingContract.stake('user1', BigNumber.from(100));
    expect(stakingContract.stakedBalances.get('user1')).toEqual(BigNumber.from(100));

    stakingContract.withdraw('user1', BigNumber.from(50));
    expect(stakingContract.stakedBalances.get('user1')).toEqual(BigNumber.from(50));
  });

  it('should calculate rewards correctly', () => {
    stakingContract.stake('user1', BigNumber.from(100));
    expect(stakingContract.claimRewards('user1')).toEqual(BigNumber.from(1000));
  });
});