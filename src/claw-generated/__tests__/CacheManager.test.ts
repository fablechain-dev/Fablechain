import { CacheManager } from '../CacheManager';
import { DatabaseService } from '../DatabaseService';
import { QueryResult } from 'your-database-client';

describe('CacheManager', () => {
  let databaseService: DatabaseService;
  let cacheManager: CacheManager;

  beforeEach(() => {
    databaseService = new DatabaseService(5, { /* connection options */ });
    cacheManager = new CacheManager(databaseService, 100);
  });

  test('should cache query results', async () => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const params = [1];

    // First query should hit the database
    const result1 = await cacheManager.query(sql, params);
    expect(result1).toEqual([{ id: 1, name: 'John Doe' }]);

    // Second query should be served from the cache
    const result2 = await cacheManager.query(sql, params);
    expect(result2).toEqual(result1);
  });

  test('should evict least recently used entries', async () => {
    const sql1 = 'SELECT * FROM users WHERE id = ?';
    const sql2 = 'SELECT * FROM posts WHERE user_id = ?';
    const params1 = [1];
    const params2 = [1];

    // Fill the cache
    await cacheManager.query(sql1, params1);
    await cacheManager.query(sql2, params2);
    await cacheManager.query(sql1, params1);

    // Evict the least recently used entry
    await cacheManager.query(sql2, params2);
    expect(cacheManager['cache'].has(`${sql1}:${JSON.stringify(params1)}`)).toBe(true);
    expect(cacheManager['cache'].has(`${sql2}:${JSON.stringify(params2)}`)).toBe(true);
  });
});