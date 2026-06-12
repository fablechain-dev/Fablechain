import { CacheManager } from '../CacheManager';
import { DatabaseService } from '../DatabaseService';
import { QueryResult } from 'your-database-client';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  let databaseService: DatabaseService;

  beforeEach(() => {
    databaseService = {
      query: jest.fn(),
    } as unknown as DatabaseService;
    cacheManager = new CacheManager(databaseService, 100);
  });

  test('should cache query results', async () => {
    const sql = 'SELECT * FROM users';
    const params = [1, 'john@example.com'];
    const expectedResult: QueryResult = [
      { id: 1, email: 'john@example.com' },
    ];

    jest.spyOn(databaseService, 'query').mockResolvedValue(expectedResult);

    // First query should hit the database
    const result1 = await cacheManager.query(sql, params);
    expect(databaseService.query).toHaveBeenCalledWith(sql, params);
    expect(result1).toEqual(expectedResult);

    // Second query should return the cached result
    const result2 = await cacheManager.query(sql, params);
    expect(databaseService.query).toHaveBeenCalledTimes(1);
    expect(result2).toEqual(expectedResult);
  });

  test('should evict least recently used entries', async () => {
    const sql1 = 'SELECT * FROM users';
    const sql2 = 'SELECT * FROM posts';
    const params1 = [1, 'john@example.com'];
    const params2 = [2, 'jane@example.com'];
    const expectedResult1: QueryResult = [
      { id: 1, email: 'john@example.com' },
    ];
    const expectedResult2: QueryResult = [
      { id: 2, email: 'jane@example.com' },
    ];

    jest.spyOn(databaseService, 'query')
      .mockResolvedValueOnce(expectedResult1)
      .mockResolvedValueOnce(expectedResult2);

    // Fill the cache
    await cacheManager.query(sql1, params1);
    await cacheManager.query(sql2, params2);
    expect(databaseService.query).toHaveBeenCalledTimes(2);

    // Access the first query again to update the LRU queue
    await cacheManager.query(sql1, params1);
    expect(databaseService.query).toHaveBeenCalledTimes(2);

    // Add a new query that should evict the least recently used entry
    const sql3 = 'SELECT * FROM comments';
    const params3 = [3, 'bob@example.com'];
    const expectedResult3: QueryResult = [
      { id: 3, email: 'bob@example.com' },
    ];
    jest.spyOn(databaseService, 'query').mockResolvedValueOnce(expectedResult3);

    await cacheManager.query(sql3, params3);
    expect(databaseService.query).toHaveBeenCalledTimes(3);
  });
});