import { Transaction } from './Transaction';
import { EventLog } from './EventLog';

export class Block {
  transactions: Transaction[] = [];
  eventLog: EventLog = new EventLog();

  addTransaction(tx: Transaction): void {
    this.transactions.push(tx);
    this.eventLog.addEvents(tx.eventLog.getEvents());
  }

  getEvents(eventName?: string): Event[] {
    return this.eventLog.filterEvents(eventName);
  }
}