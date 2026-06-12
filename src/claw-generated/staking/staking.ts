import { Account } from '../accounts/account';

export class Staking {
  private delegations: Map<string, Account[]> = new Map();
  private stakedBalances: Map<string, { amount: number, timestamp: number }> = new Map();
  private rewardsRate = 0.05; // 5% annual rewards rate

  stakeTokens(account: Account, amount: number) {
    // Add tokens to account's staked balance
    this.stakedBalances.set(account.address, {
      amount: (this.stakedBalances.get(account.address)?.amount || 0) + amount,
      timestamp: Date.now()
    });

    // Update delegations map
    let delegators = this.delegations.get(account.address) || [];
    delegators.push(account);
    this.delegations.set(account.address, delegators);
  }

  claimRewards(account: Account) {
    // Calculate rewards based on staked balance and time
    const { amount, timestamp } = this.stakedBalances.get(account.address) || { amount: 0, timestamp: 0 };
    const timeDelta = Date.now() - timestamp;
    const rewards = amount * this.rewardsRate * (timeDelta / (1000 * 60 * 60 * 24 * 365)); // Assuming 5% annual rate

    // Transfer rewards to account's balance
    account.balance += rewards;
    this.stakedBalances.set(account.address, {
      amount,
      timestamp: Date.now()
    });
  }

  withdraw(account: Account, amount: number) {
    // Reduce account's staked balance
    const { amount: stakedAmount, timestamp } = this.stakedBalances.get(account.address) || { amount: 0, timestamp: 0 };
    this.stakedBalances.set(account.address, {
      amount: stakedAmount - amount,
      timestamp
    });

    // Remove account from delegators list
    const delegators = this.delegations.get(account.address) || [];
    this.delegations.set(account.address, delegators.filter(d => d.address !== account.address));

    // Transfer withdrawn tokens to account's balance
    account.balance += amount;
  }

  getDelegators(account: Account): Account[] {
    return this.delegations.get(account.address) || [];
  }
}