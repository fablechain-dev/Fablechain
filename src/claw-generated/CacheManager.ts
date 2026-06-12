import { LRUCache } from './LRUCache';

interface CachedQueryResult<T> {
  data: T;
  timestamp: number;
}

class CacheManager<T> {
  private cache: LRUCache<string, CachedQueryResult<T>>;

  constructor(private capacity: number, private expirationSeconds: number) {
    this.cache = new LRUCache(capacity);
  }

  get(key: string): T | null {
    const cachedResult = this.cache.get(key);
    if (cachedResult && this.isValid(cachedResult)) {
      return cachedResult.data;
    }
    return null;
  }

  set(key: string, data: T): void {
    const now = Date.now();
    this.cache.set(key, { data, timestamp: now });
  }

  private isValid(cachedResult: CachedQueryResult<T>): boolean {
    const now = Date.now();
    const expirationTime = cachedResult.timestamp + this.expirationSeconds * 1000;
    return now < expirationTime;
  }
}

export { CacheManager };