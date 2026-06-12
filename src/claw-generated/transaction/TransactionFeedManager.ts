import { Transaction } from './Transaction';
import { TransactionPool } from './TransactionPool';
import { EventEmitter } from '../EventEmitter';

export class TransactionFeedManager {
  private transactionPool: TransactionPool;
  private eventEmitter: EventEmitter;
  private transactionQueue: Transaction[] = [];
  private maxQueueSize: number = 100;

  constructor(transactionPool: TransactionPool, eventEmitter: EventEmitter) {
    this.transactionPool = transactionPool;
    this.eventEmitter = eventEmitter;

    this.transactionPool.on('newTransaction', (tx: Transaction) => {
      this.addToFeed(tx);
    });
  }

  addToFeed(tx: Transaction) {
    this.transactionQueue.push(tx);
    if (this.transactionQueue.length > this.maxQueueSize) {
      this.transactionQueue.shift();
    }
    this.eventEmitter.emit('newTransaction', tx);
  }

  getLatestTransactions(limit: number = 10): Transaction[] {
    return this.transactionQueue.slice(-limit);
  }
}