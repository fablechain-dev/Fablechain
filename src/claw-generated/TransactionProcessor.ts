import { Transaction } from './Transaction';
import { TransactionSigner } from './TransactionSigner';
import { TransactionPool } from './TransactionPool';

export class TransactionProcessor {
  private transactionSigner: TransactionSigner;
  private transactionPool: TransactionPool;

  constructor(transactionSigner: TransactionSigner, transactionPool: TransactionPool) {
    this.transactionSigner = transactionSigner;
    this.transactionPool = transactionPool;
  }

  async processTransaction(tx: Transaction): Promise<void> {
    if (this.transactionSigner.verifyTransaction(tx)) {
      this.transactionPool.addTransaction(tx);
    } else {
      throw new Error('Invalid transaction');
    }
  }
}