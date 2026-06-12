import { BloomFilter } from './bloom_filter';

export class Event {
  contractAddress: string;
  name: string;
  indexedParams: any[];
  unindexedParams: any[];

  constructor(contractAddress: string, name: string, indexedParams: any[], unindexedParams: any[]) {
    this.contractAddress = contractAddress;
    this.name = name;
    this.indexedParams = indexedParams;
    this.unindexedParams = unindexedParams;
  }
}

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

  getEvents(filter: { contractAddress?: string; name?: string; indexedParams?: any[]; unindexedParams?: any[] }): Event[] {
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
    if (filter.indexedParams) {
      events = events.filter(event => event.indexedParams.every((param, i) => param === filter.indexedParams[i]));
    }
    if (filter.unindexedParams) {
      events = events.filter(event => event.unindexedParams.every((param, i) => param === filter.unindexedParams[i]));
    }

    return events;
  }
}