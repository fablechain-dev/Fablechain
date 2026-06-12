// events.ts

import { Transaction, TransactionReceipt } from './transaction';
import { bloom } from './utils';

interface EventData {
  name: string;
  data: any;
}

export class EventEmitter {
  private events: EventData[] = [];

  emit(name: string, data: any) {
    this.events.push({ name, data });
  }

  getEvents(): EventData[] {
    return this.events;
  }

  clearEvents() {
    this.events = [];
  }
}

export class EventReceipt {
  constructor(
    public transactionHash: string,
    public events: EventData[]
  ) {}

  getBloomFilter(): number[] {
    return bloom(this.events.map(e => e.name));
  }
}