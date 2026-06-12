import { Transaction } from './transaction';

export class Block {
  transactions: Transaction[] = [];
  reward: number = 10; // Base block reward

  addTransaction(tx: Transaction) {
    this.transactions.push(tx);
  }

  calculateReward(): number {
    let totalFees = 0;
    for (const tx of this.transactions) {
      totalFees += tx.calculateFee();
    }
    return this.reward + totalFees;
  }
}