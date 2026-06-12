import { Block, Transaction } from './block';
import { Event } from './event';

class BloomFilter {
  private filter: number[];
  private numHashes: number;
  private capacity: number;

  constructor(capacity: number, numHashes: number = 3) {
    this.capacity = capacity;
    this.numHashes = numHashes;
    this.filter = new Array(Math.ceil(capacity / 32)).fill(0);
  }

  add(item: string | number): void {
    for (let i = 0; i < this.numHashes; i++) {
      const hash = this.hash(item, i);
      this.filter[Math.floor(hash / 32)] |= (1 << (hash % 32));
    }
  }

  mayContain(item: string | number): boolean {
    for (let i = 0; i < this.numHashes; i++) {
      const hash = this.hash(item, i);
      if ((this.filter[Math.floor(hash / 32)] & (1 << (hash % 32))) === 0) {
        return false;
      }
    }
    return true;
  }

  private hash(item: string | number, seed: number): number {
    let hash = 0;
    const str = item.toString();
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs((hash + seed) % this.capacity);
  }
}

export class EventBloomFilter {
  private blockFilter: BloomFilter;
  private eventFilters: Map<string, BloomFilter>;

  constructor(capacity: number) {
    this.blockFilter = new BloomFilter(capacity);
    this.eventFilters = new Map();
  }

  addBlock(block: Block): void {
    this.blockFilter.add(block.hash);
    for (const tx of block.transactions) {
      this.addTransaction(tx);
    }
  }

  addTransaction(tx: Transaction): void {
    this.blockFilter.add(tx.hash);
    for (const event of tx.events) {
      this.addEvent(event);
    }
  }

  addEvent(event: Event): void {
    const filterKey = `${event.address}:${event.name}`;
    let eventFilter = this.eventFilters.get(filterKey);
    if (!eventFilter) {
      eventFilter = new BloomFilter(this.blockFilter.capacity);
      this.eventFilters.set(filterKey, eventFilter);
    }
    eventFilter.add(event.data);
  }

  mayContainBlock(block: Block): boolean {
    return this.blockFilter.mayContain(block.hash);
  }

  mayContainEvent(event: Event): boolean {
    const filterKey = `${event.address}:${event.name}`;
    const eventFilter = this.eventFilters.get(filterKey);
    return eventFilter ? eventFilter.mayContain(event.data) : false;
  }
}