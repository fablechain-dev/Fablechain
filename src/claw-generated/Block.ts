import { BigNumber } from 'ethers';
import { Stake } from './staking/Stake';
import { StateSnapshot } from './StateSnapshot';

export class Block {
  // Existing block properties...

  stateDiffs: StateSnapshot = new StateSnapshot();

  constructor(/* existing params */) {
    // Existing constructor logic...
  }

  addStake(address: string, stake: Stake): void {
    // Existing addStake logic...
  }

  getStakesForAddress(address: string): Stake[] {
    // Existing getStakesForAddress logic...
  }

  getTotalStakedAmount(): BigNumber {
    // Existing getTotalStakedAmount logic...
  }

  applyStateDiff(diff: StateSnapshot): void {
    this.stateDiffs.merge(diff);
  }

  getStateDiff(): StateSnapshot {
    return this.stateDiffs;
  }
}