import { TransactionReceipt } from './TransactionReceipt';
import { Log, LogEntry, BloomFilter } from '../types';

export class Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  gasUsed: number;
  status: boolean;

  constructor(
    hash: string,
    from: string,
    to: string,
    amount: number,
    timestamp: number,
    gasUsed: number,
    status: boolean
  ) {
    this.hash = hash;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = timestamp;
    this.gasUsed = gasUsed;
    this.status = status;
  }

  generateReceipt(): TransactionReceipt {
    // Generate transaction receipt data
    const logs: LogEntry[] = []; // Replace with actual logs
    const bloomFilter: BloomFilter = new BloomFilter(); // Replace with actual bloom filter

    return new TransactionReceipt(this.status, this.gasUsed, logs, bloomFilter);
  }
}