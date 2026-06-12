import LRUCache from '../LRUCache';
import { DatabaseConnection } from '../database';

export class QueryCacheService {
  private static cache: LRUCache<string, any> = new LRUCache(1000);

  static async query(sql: string, values?: any[]): Promise<any> {
    const cacheKey = this.getCacheKey(sql, values);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = await DatabaseConnection.query(sql, values);
    this.cache.set(cacheKey, result);
    return result;
  }

  private static getCacheKey(sql: string, values?: any[]): string {
    return `${sql}:${values ? values.join(',') : ''}`;
  }
}