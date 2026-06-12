import { Transaction } from './Transaction';
import { Subject, Observable } from 'rxjs';
import { TransactionBroadcaster } from './network/transaction-broadcaster';

class TransactionPool {
  private transactions: Transaction[] = [];
  private transactionSubject = new Subject<Transaction[]>();
  private transactionBroadcaster: TransactionBroadcaster;

  constructor(transactionBroadcaster: TransactionBroadcaster) {
    this.transactionBroadcaster = transactionBroadcaster;
    this.transactionBroadcaster.subscribe((tx) => this.addTransaction(tx));
  }

  addTransaction(tx: Transaction) {
    this.transactions.push(tx);
    this.transactionSubject.next(this.transactions);
  }

  getTransactions(): Transaction[] {
    return this.transactions;
  }

  subscribe(observer: (transactions: Transaction[]) => void): { unsubscribe: () => void } {
    return this.transactionSubject.subscribe(observer);
  }
}

export { TransactionPool };