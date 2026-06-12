import { ConnectionPool } from './ConnectionPool';
import { Connection, createConnection, ConnectionOptions } from 'your-database-client';

jest.mock('your-database-client');

describe('ConnectionPool', () => {
  let connectionOptions: ConnectionOptions;

  beforeEach(() => {
    connectionOptions = {
      host: 'localhost',
      port: 5432,
      user: 'testuser',
      password: 'testpass',
      database: 'testdb'
    };
  });

  it('should create a new connection when pool is empty', async () => {
    const pool = ConnectionPool.getInstance(5, connectionOptions);
    const connection = await pool.getConnection();
    expect(createConnection).toHaveBeenCalledWith(connectionOptions);
    pool.releaseConnection(connection);
  });

  it('should reuse a connection from the pool', async () => {
    const pool = ConnectionPool.getInstance(5, connectionOptions);
    const connection1 = await pool.getConnection();
    pool.releaseConnection(connection1);
    const connection2 = await pool.getConnection();
    expect(connection1).toBe(connection2);
  });

  it('should close a connection when the pool is full', async () => {
    const pool = ConnectionPool.getInstance(1, connectionOptions);
    const connection1 = await pool.getConnection();
    const connection2 = await pool.getConnection();
    expect(connection2.close).toHaveBeenCalled();
  });

  it('should throw an error when the pool is exhausted', async () => {
    const pool = ConnectionPool.getInstance(1, connectionOptions);
    await pool.getConnection();
    await pool.getConnection();
    await expect(pool.getConnection()).rejects.toThrow('Connection pool exhausted');
  });
});