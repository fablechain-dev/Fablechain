import { EventLog } from './EventLog';

export class Transaction {
  public nonce: number;
  eventLog: EventLog = new EventLog();

  constructor(nonce: number) {
    this.nonce = nonce;
  }

  emitEvent(event: Event): void {
    this.eventLog.addEvent(event);
  }
}