import { Event } from './events';

export class TransactionReceipt {
  blockHash: string;
  blockNumber: number;
  contractAddress: string | null;
  cumulativeGasUsed: number;
  events: Event[];
  gasUsed: number;
  logs: any[];
  logsBloom: string;
  status: boolean;
  transactionHash: string;
  transactionIndex: number;

  constructor(
    blockHash: string,
    blockNumber: number,
    contractAddress: string | null,
    cumulativeGasUsed: number,
    events: Event[],
    gasUsed: number,
    logs: any[],
    logsBloom: string,
    status: boolean,
    transactionHash: string,
    transactionIndex: number
  ) {
    this.blockHash = blockHash;
    this.blockNumber = blockNumber;
    this.contractAddress = contractAddress;
    this.cumulativeGasUsed = cumulativeGasUsed;
    this.events = events;
    this.gasUsed = gasUsed;
    this.logs = logs;
    this.logsBloom = logsBloom;
    this.status = status;
    this.transactionHash = transactionHash;
    this.transactionIndex = transactionIndex;
  }
}