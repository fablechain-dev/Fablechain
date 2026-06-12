import { ConnectionPool } from './ConnectionPool';
import { Connection, QueryResult } from 'your-database-client';
import { CacheManager } from './CacheManager';

class DatabaseService {
  private connectionPool: ConnectionPool;
  private cacheManager: CacheManager;

  constructor(maxConnections: number, connectionOptions: any) {
    this.connectionPool = ConnectionPool.getInstance(maxConnections, connectionOptions);
    this.cacheManager = new CacheManager(this);
  }

  public async query(sql: string, params?: any[]): Promise<QueryResult> {
    return this.cacheManager.query(sql, params);
  }

  public async transaction(callback: (connection: Connection) => Promise<void>): Promise<void> {
    const connection = await this.connectionPool.getConnection();
    try {
      await connection.beginTransaction();
      await callback(connection);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      this.connectionPool.releaseConnection(connection);
    }
  }
}

export { DatabaseService };