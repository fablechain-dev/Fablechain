import { Event } from './event';
import { BloomFilter } from './bloom_filter';

export class EventEmitter {
  private events: Event[] = [];
  private eventBloomFilters: Map<string, BloomFilter> = new Map();

  emit(contractAddress: string, name: string, indexedParams: any[], unindexedParams: any[]) {
    const event = new Event(contractAddress, name, indexedParams, unindexedParams);
    this.events.push(event);

    // Update the bloom filter for this event type
    let bloomFilter = this.eventBloomFilters.get(event.name);
    if (!bloomFilter) {
      bloomFilter = new BloomFilter();
      this.eventBloomFilters.set(event.name, bloomFilter);
    }
    bloomFilter.add(event);
  }

  getEvents(filter: { contractAddress?: string; name?: string }): Event[] {
    let events = this.events;

    // Apply bloom filter if available
    if (filter.name) {
      const bloomFilter = this.eventBloomFilters.get(filter.name);
      if (bloomFilter) {
        events = events.filter(event => bloomFilter.mayContain(event));
      }
    }

    // Apply other filters
    if (filter.contractAddress) {
      events = events.filter(event => event.contractAddress === filter.contractAddress);
    }

    return events;
  }
}