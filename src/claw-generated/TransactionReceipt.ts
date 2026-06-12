import { Log, LogEntry, BloomFilter } from '../types';

export class TransactionReceipt {
  status: boolean;
  gasUsed: number;
  logs: LogEntry[];
  bloomFilter: BloomFilter;

  constructor(status: boolean, gasUsed: number, logs: LogEntry[], bloomFilter: BloomFilter) {
    this.status = status;
    this.gasUsed = gasUsed;
    this.logs = logs;
    this.bloomFilter = bloomFilter;
  }
}