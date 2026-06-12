import { Log, LogEntry } from './types';

export class TransactionReceipt {
  status: boolean;
  gasUsed: number;
  logs: Log[];
  logsBloom: string;

  constructor(
    status: boolean,
    gasUsed: number,
    logs: Log[]
  ) {
    this.status = status;
    this.gasUsed = gasUsed;
    this.logs = logs;
    this.logsBloom = this.generateLogsBloom(logs);
  }

  private generateLogsBloom(logs: Log[]): string {
    // Implement logic to generate the bloom filter from the logs
    return '0x0';
  }

  toJSON() {
    return {
      status: this.status,
      gasUsed: this.gasUsed,
      logs: this.logs,
      logsBloom: this.logsBloom
    };
  }
}