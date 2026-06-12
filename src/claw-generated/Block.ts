import { Transaction } from './Transaction';
import { TransactionReceipt } from './transaction/TransactionReceipt';
import { Bloom } from './bloom-filter';

export class Block {
  blockNumber: number;
  blockHash: string;
  parentHash: string;
  timestamp: number;
  transactions: Transaction[];
  transactionReceipts: TransactionReceipt[];
  stateRoot: string;
  receiptsRoot: string;
  logsBloom: Bloom;

  constructor(
    blockNumber: number,
    blockHash: string,
    parentHash: string,
    timestamp: number,
    transactions: Transaction[],
    transactionReceipts: TransactionReceipt[],
    stateRoot: string,
    receiptsRoot: string,
    logsBloom: Bloom
  ) {
    this.blockNumber = blockNumber;
    this.blockHash = blockHash;
    this.parentHash = parentHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.transactionReceipts = transactionReceipts;
    this.stateRoot = stateRoot;
    this.receiptsRoot = receiptsRoot;
    this.logsBloom = logsBloom;
  }
}