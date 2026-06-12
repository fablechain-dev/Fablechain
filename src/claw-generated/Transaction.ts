import { EventLog } from './EventLog';

export class Transaction {
  // existing transaction properties
  eventLog: EventLog = new EventLog();

  emitEvent(event: Event): void {
    this.eventLog.addEvent(event);
  }
}