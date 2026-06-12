import { createConnection, Connection, ConnectionOptions } from 'your-database-client';

class ConnectionPool {
  private static instance: ConnectionPool;
  private connectionPool: Connection[];
  private maxConnections: number;
  private connectionOptions: ConnectionOptions;

  private constructor(maxConnections: number, connectionOptions: ConnectionOptions) {
    this.maxConnections = maxConnections;
    this.connectionOptions = connectionOptions;
    this.connectionPool = [];
  }

  public static getInstance(maxConnections: number, connectionOptions: ConnectionOptions): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool(maxConnections, connectionOptions);
    }
    return ConnectionPool.instance;
  }

  public async getConnection(): Promise<Connection> {
    if (this.connectionPool.length > 0) {
      return this.connectionPool.pop()!;
    } else if (this.connectionPool.length < this.maxConnections) {
      const connection = await createConnection(this.connectionOptions);
      return connection;
    } else {
      throw new Error('Connection pool exhausted');
    }
  }

  public releaseConnection(connection: Connection): void {
    if (this.connectionPool.length < this.maxConnections) {
      this.connectionPool.push(connection);
    } else {
      connection.close();
    }
  }
}

export { ConnectionPool };