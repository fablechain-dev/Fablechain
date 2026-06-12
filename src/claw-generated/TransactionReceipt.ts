import { Log, LogEntry, BloomFilter, Event, EventEntry } from './types';
import { Transaction } from './Transaction';

export class TransactionReceipt {
  status: boolean;
  gasUsed: number;
  logs: LogEntry[];
  events: EventEntry[];
  bloomFilter: BloomFilter;

  constructor(
    status: boolean,
    gasUsed: number,
    logs: LogEntry[],
    events: EventEntry[],
    bloomFilter: BloomFilter
  ) {
    this.status = status;
    this.gasUsed = gasUsed;
    this.logs = logs;
    this.events = events;
    this.bloomFilter = bloomFilter;
  }

  static fromTransaction(tx: Transaction, status: boolean, gasUsed: number, logs: LogEntry[], events: EventEntry[], bloomFilter: BloomFilter): TransactionReceipt {
    return new TransactionReceipt(status, gasUsed, logs, events, bloomFilter);
  }
}