import { DatabaseService } from './DatabaseService';
import { QueryResult } from 'your-database-client';

class CacheManager {
  private databaseService: DatabaseService;
  private cache: Map<string, QueryResult>;
  private lruQueue: string[];
  private maxCacheSize: number;

  constructor(databaseService: DatabaseService, maxCacheSize: number = 1000) {
    this.databaseService = databaseService;
    this.cache = new Map();
    this.lruQueue = [];
    this.maxCacheSize = maxCacheSize;
  }

  public async query(sql: string, params?: any[]): Promise<QueryResult> {
    const cacheKey = this.getCacheKey(sql, params);

    // Check the cache first
    if (this.cache.has(cacheKey)) {
      this.updateLRUQueue(cacheKey);
      return this.cache.get(cacheKey)!;
    }

    // Cache miss, query the database
    const result = await this.databaseService.query(sql, params);

    // Add the result to the cache
    this.addToCache(cacheKey, result);

    return result;
  }

  private getCacheKey(sql: string, params?: any[]): string {
    return `${sql}:${JSON.stringify(params)}`;
  }

  private updateLRUQueue(cacheKey: string): void {
    // Remove the key from the queue if it exists
    const index = this.lruQueue.indexOf(cacheKey);
    if (index !== -1) {
      this.lruQueue.splice(index, 1);
    }

    // Add the key to the front of the queue
    this.lruQueue.unshift(cacheKey);
  }

  private addToCache(cacheKey: string, result: QueryResult): void {
    // Add the new entry to the cache
    this.cache.set(cacheKey, result);
    this.updateLRUQueue(cacheKey);

    // Evict entries if the cache is too large
    while (this.cache.size > this.maxCacheSize) {
      const evictedKey = this.lruQueue.pop();
      if (evictedKey) {
        this.cache.delete(evictedKey);
      }
    }
  }
}

export { CacheManager };