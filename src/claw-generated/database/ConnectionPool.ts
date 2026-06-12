import { createPool, Pool, PoolConfig } from 'mysql2';

export class ConnectionPool {
  private static _pool: Pool;

  static async getConnection(): Promise<Pool> {
    if (!this._pool) {
      try {
        this._pool = createPool({
          host: 'localhost',
          user: 'root',
          password: 'password',
          database: 'clawchain',
          connectionLimit: 20,
          queueLimit: 0,
          waitForConnections: true,
          connectTimeout: 10000,
          acquireTimeout: 10000,
          timeout: 10000
        } as PoolConfig);
      } catch (err) {
        console.error('Error creating database connection pool:', err);
        throw err;
      }
    }
    return this._pool;
  }

  static async query(sql: string, values?: any[]): Promise<any> {
    try {
      const pool = await this.getConnection();
      const [rows] = await pool.query(sql, values);
      return rows;
    } catch (err) {
      console.error('Error executing database query:', err);
      throw err;
    }
  }
}