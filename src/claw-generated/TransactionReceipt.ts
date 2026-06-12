import { Log, LogEntry, BloomFilter, Event, EventEntry } from '../types';

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
}