import { Transaction } from './Transaction';
import { TransactionPool } from './TransactionPool';
import { TransactionValidator } from './TransactionValidator';
import { TransactionProcessor } from './TransactionProcessor';
import { TransactionFeedManager } from './TransactionFeedManager';
import { EventEmitter } from '../EventEmitter';

export class TransactionManager {
  private transactionPool: TransactionPool;
  private transactionValidator: TransactionValidator;
  private transactionProcessor: TransactionProcessor;
  private transactionFeedManager: TransactionFeedManager;

  constructor(
    transactionPool: TransactionPool,
    transactionValidator: TransactionValidator,
    transactionProcessor: TransactionProcessor,
    eventEmitter: EventEmitter
  ) {
    this.transactionPool = transactionPool;
    this.transactionValidator = transactionValidator;
    this.transactionProcessor = transactionProcessor;
    this.transactionFeedManager = new TransactionFeedManager(this.transactionPool, eventEmitter);
  }

  async addTransaction(tx: Transaction): Promise<void> {
    if (await this.transactionValidator.validateTransaction(tx)) {
      this.transactionPool.addTransaction(tx);
    } else {
      // Handle invalid transaction
    }
  }

  processTransactions(): void {
    const transactions = this.transactionPool.getTransactions();
    this.transactionProcessor.processTransactions(transactions);
  }
}