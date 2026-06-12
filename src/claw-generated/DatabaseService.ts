import { ConnectionPool } from './ConnectionPool';
import { Connection, QueryResult } from 'your-database-client';

class DatabaseService {
  private connectionPool: ConnectionPool;

  constructor(maxConnections: number, connectionOptions: any) {
    this.connectionPool = ConnectionPool.getInstance(maxConnections, connectionOptions);
  }

  public async query(sql: string, params?: any[]): Promise<QueryResult> {
    const connection = await this.connectionPool.getConnection();
    try {
      const result = await connection.query(sql, params);
      this.connectionPool.releaseConnection(connection);
      return result;
    } catch (err) {
      this.connectionPool.releaseConnection(connection);
      throw err;
    }
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