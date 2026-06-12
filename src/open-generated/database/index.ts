import { ConnectionPool } from './ConnectionPool';

export class DatabaseManager {
  static initialize(options: any): void {
    ConnectionPool.initialize(options);
  }

  static async query(sql: string, params?: any[]): Promise<any[]> {
    return await ConnectionPool.query(sql, params);
  }
}