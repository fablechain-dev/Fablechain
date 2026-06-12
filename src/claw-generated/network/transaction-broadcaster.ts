import { Transaction } from '../Transaction';
import { Subject } from 'rxjs';

class TransactionBroadcaster {
  private transactionSubject = new Subject<Transaction>();

  publishTransaction(tx: Transaction) {
    this.transactionSubject.next(tx);
  }

  subscribe(observer: (tx: Transaction) => void): { unsubscribe: () => void } {
    return this.transactionSubject.subscribe(observer);
  }
}

export { TransactionBroadcaster };