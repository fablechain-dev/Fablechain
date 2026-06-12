import { Event } from './Event';
import { BloomFilter, EventBloomFilter } from './bloom_filter';

export class EventLog {
  private events: Event[] = [];
  private bloomFilter: EventBloomFilter;

  constructor(capacity: number) {
    this.bloomFilter = new EventBloomFilter(capacity);
  }

  addBlock(block: Block): void {
    this.bloomFilter.addBlock(block);
  }

  addTransaction(tx: Transaction): void {
    this.bloomFilter.addTransaction(tx);
  }

  addEvent(event: Event): void {
    this.events.push(event);
    this.bloomFilter.addEvent(event);
  }

  getEvents(eventName?: string): Event[] {
    return this.bloomFilter.mayContainEvent({ name: eventName })
      ? this.events.filter(event => event.name === eventName)
      : [];
  }

  getBlocks(blockHash: string): Block[] {
    return this.bloomFilter.mayContainBlock({ hash: blockHash })
      ? this.blocks.filter(block => block.hash === blockHash)
      : [];
  }
}