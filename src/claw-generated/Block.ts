import { BigNumber } from 'ethers';
import { Stake } from './staking/Stake';

export class Block {
  // Existing block properties...

  stakes: Map<string, Stake[]> = new Map();

  constructor(/* existing params */) {
    // Existing constructor logic...
  }

  addStake(address: string, stake: Stake): void {
    if (!this.stakes.has(address)) {
      this.stakes.set(address, []);
    }
    this.stakes.get(address)!.push(stake);
  }

  getStakesForAddress(address: string): Stake[] {
    return this.stakes.get(address) || [];
  }

  getTotalStakedAmount(): BigNumber {
    let total = BigNumber.from(0);
    for (const stakes of this.stakes.values()) {
      for (const stake of stakes) {
        total = total.add(stake.amount);
      }
    }
    return total;
  }
}