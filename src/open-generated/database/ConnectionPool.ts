import { createPool, Pool, PoolConnection, PoolOptions } from 'mysql2';

export class ConnectionPool {
  private static pool: Pool;

  static initialize(options: PoolOptions): void {
    ConnectionPool.pool = createPool({
      ...options,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
    });

    ConnectionPool.pool.on('connection', (connection) => {
      console.log('New database connection created');
    });

    ConnectionPool.pool.on('acquire', (connection) => {
      console.log('Connection acquired from pool');
    });

    ConnectionPool.pool.on('release', (connection) => {
      console.log('Connection released to pool');
    });

    ConnectionPool.pool.on('error', (err) => {
      console.error('Database connection pool error:', err);
    });
  }

  static async getConnection(): Promise<PoolConnection> {
    try {
      return await ConnectionPool.pool.getConnection();
    } catch (err) {
      console.error('Error getting connection from pool:', err);
      throw err;
    }
  }

  static async query(sql: string, params?: any[]): Promise<any[]> {
    const connection = await ConnectionPool.getConnection();
    try {
      const [rows] = await connection.execute(sql, params);
      return rows;
    } catch (err) {
      console.error('Error executing query:', err);
      throw err;
    } finally {
      connection.release();
    }
  }
}