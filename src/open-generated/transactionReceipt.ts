import { ByteArray, Hex } from './types';
import { Event, EventLog } from './event';

export class TransactionReceipt {
  transactionHash: Hex;
  transactionIndex: number;
  blockHash: Hex;
  blockNumber: number;
  from: ByteArray;
  to: ByteArray;
  contractAddress: ByteArray | null;
  cumulativeGasUsed: number;
  gasUsed: number;
  status: boolean;
  logs: EventLog[];

  constructor(
    transactionHash: Hex,
    transactionIndex: number,
    blockHash: Hex,
    blockNumber: number,
    from: ByteArray,
    to: ByteArray,
    contractAddress: ByteArray | null,
    cumulativeGasUsed: number,
    gasUsed: number,
    status: boolean,
    logs: EventLog[]
  ) {
    this.transactionHash = transactionHash;
    this.transactionIndex = transactionIndex;
    this.blockHash = blockHash;
    this.blockNumber = blockNumber;
    this.from = from;
    this.to = to;
    this.contractAddress = contractAddress;
    this.cumulativeGasUsed = cumulativeGasUsed;
    this.gasUsed = gasUsed;
    this.status = status;
    this.logs = logs;
  }

  toJSON(): {
    transactionHash: Hex;
    transactionIndex: number;
    blockHash: Hex;
    blockNumber: number;
    from: ByteArray;
    to: ByteArray;
    contractAddress: ByteArray | null;
    cumulativeGasUsed: number;
    gasUsed: number;
    status: boolean;
    logs: {
      events: { name: string; parameters: { [key: string]: any } }[];
      address: ByteArray;
      transactionHash: Hex;
      blockNumber: number;
      logIndex: number;
    }[];
  } {
    return {
      transactionHash: this.transactionHash,
      transactionIndex: this.transactionIndex,
      blockHash: this.blockHash,
      blockNumber: this.blockNumber,
      from: this.from,
      to: this.to,
      contractAddress: this.contractAddress,
      cumulativeGasUsed: this.cumulativeGasUsed,
      gasUsed: this.gasUsed,
      status: this.status,
      logs: this.logs.map((log) => log.toJSON()),
    };
  }

  static fromJSON(json: {
    transactionHash: Hex;
    transactionIndex: number;
    blockHash: Hex;
    blockNumber: number;
    from: ByteArray;
    to: ByteArray;
    contractAddress: ByteArray | null;
    cumulativeGasUsed: number;
    gasUsed: number;
    status: boolean;
    logs: {
      events: { name: string; parameters: { [key: string]: any } }[];
      address: ByteArray;
      transactionHash: Hex;
      blockNumber: number;
      logIndex: number;
    }[];
  }): TransactionReceipt {
    return new TransactionReceipt(
      json.transactionHash,
      json.transactionIndex,
      json.blockHash,
      json.blockNumber,
      json.from,
      json.to,
      json.contractAddress,
      json.cumulativeGasUsed,
      json.gasUsed,
      json.status,
      json.logs.map(EventLog.fromJSON)
    );
  }
}