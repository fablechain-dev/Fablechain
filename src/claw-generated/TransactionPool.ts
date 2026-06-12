import { Transaction } from './Transaction';
import { PriorityQueue } from '../utils/PriorityQueue';

class TransactionPool {
  private transactions: PriorityQueue<Transaction>;
  private executionDelay: number; // in milliseconds

  constructor(executionDelay: number = 5000) {
    this.transactions = new PriorityQueue<Transaction>((a, b) => {
      // Priority based on submission time, gas price, and randomness
      const timeWeight = 0.5;
      const gasPriceWeight = 0.4;
      const randomWeight = 0.1;
      const timeDiff = a.timestamp - b.timestamp;
      const gasPriceDiff = b.gasPrice - a.gasPrice;
      const randomDiff = Math.random() - Math.random();
      return (
        timeWeight * timeDiff +
        gasPriceWeight * gasPriceDiff +
        randomWeight * randomDiff
      );
    });
    this.executionDelay = executionDelay;
  }

  addTransaction(tx: Transaction): void {
    this.transactions.enqueue(tx);
  }

  async processTransactions(): Promise<void> {
    while (this.transactions.length > 0) {
      const tx = this.transactions.dequeue();
      // Delay transaction execution to prevent sandwich attacks
      await new Promise((resolve) => setTimeout(resolve, this.executionDelay));
      // Process the transaction
      await this.processTransaction(tx);
    }
  }

  private async processTransaction(tx: Transaction): Promise<void> {
    // Implement transaction processing logic here
    console.log(`Processing transaction: ${tx.hash}`);
  }

  getTransactions(): Transaction[] {
    return this.transactions.toArray();
  }

  clearTransactions(): void {
    this.transactions.clear();
  }
}

export { TransactionPool };