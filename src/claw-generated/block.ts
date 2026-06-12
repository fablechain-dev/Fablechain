import { EventBloomFilter } from './bloom_filter';

export class Block {
  height: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  bloomFilter: EventBloomFilter;

  static CHECKPOINT_INTERVAL = 10_000; // Checkpoint every 10,000 blocks
  static CHECKPOINTS: { [blockNumber: number]: { hash: string, timestamp: number } } = {
    0: { hash: '0x...', timestamp: 1620000000 },
    10000: { hash: '0x...', timestamp: 1620010000 },
    20000: { hash: '0x...', timestamp: 1620020000 },
    // Add more checkpoints here
  };

  constructor(height: number, timestamp: number, transactions: Transaction[], previousHash: string, hash: string) {
    this.height = height;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = hash;
    this.bloomFilter = new EventBloomFilter(Block.CHECKPOINT_INTERVAL);
    this.updateBloomFilter();
  }

  updateBloomFilter(): void {
    this.bloomFilter.addBlock(this);
  }

  static isAtCheckpoint(blockNumber: number): boolean {
    return blockNumber in this.CHECKPOINTS;
  }

  static getCheckpointData(blockNumber: number): { hash: string, timestamp: number } | null {
    return this.CHECKPOINTS[blockNumber] || null;
  }
}

export class Transaction {
  hash: string;
  events: Event[];

  constructor(hash: string, events: Event[]) {
    this.hash = hash;
    this.events = events;
  }
}

export class Event {
  address: string;
  name: string;
  data: string;

  constructor(address: string, name: string, data: string) {
    this.address = address;
    this.name = name;
    this.data = data;
  }
}