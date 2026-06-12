import { Transaction } from './Transaction';

export class Block {
  readonly blockNumber: number;
  readonly blockHash: string;
  readonly parentBlockHash: string;
  readonly timestamp: number;
  readonly transactions: Transaction[];
  readonly minerAddress: string;
  readonly difficulty: number;
  readonly nonce: number;
  readonly uncleBlockHashes: string[];
  readonly uncleBlockMinerAddresses: string[];
  readonly uncleBlockTimestamps: number[];

  constructor(
    blockNumber: number,
    blockHash: string,
    parentBlockHash: string,
    timestamp: number,
    transactions: Transaction[],
    minerAddress: string,
    difficulty: number,
    nonce: number,
    uncleBlockHashes: string[],
    uncleBlockMinerAddresses: string[],
    uncleBlockTimestamps: number[]
  ) {
    this.blockNumber = blockNumber;
    this.blockHash = blockHash;
    this.parentBlockHash = parentBlockHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.minerAddress = minerAddress;
    this.difficulty = difficulty;
    this.nonce = nonce;
    this.uncleBlockHashes = uncleBlockHashes;
    this.uncleBlockMinerAddresses = uncleBlockMinerAddresses;
    this.uncleBlockTimestamps = uncleBlockTimestamps;
  }

  isValid(): boolean {
    // Implement block validation logic here
    return true;
  }

  calculateReward(): number {
    // Implement reward calculation logic here, including partial rewards for uncles
    return 5;
  }
}