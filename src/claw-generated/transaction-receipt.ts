import { Event } from './contract';
import { BloomFilter } from './bloom_filter';

export class TransactionReceipt {
  readonly transactionHash: string;
  readonly blockNumber: number;
  readonly from: string;
  readonly to: string;
  readonly amount: number;
  readonly timestamp: number;
  readonly events: Event[];
  readonly bloomFilter: BloomFilter;

  constructor(
    transactionHash: string,
    blockNumber: number,
    from: string,
    to: string,
    amount: number,
    timestamp: number,
    events: Event[]
  ) {
    this.transactionHash = transactionHash;
    this.blockNumber = blockNumber;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = timestamp;
    this.events = events;

    // Generate the bloom filter for the emitted events
    this.bloomFilter = new BloomFilter(events);
  }
}