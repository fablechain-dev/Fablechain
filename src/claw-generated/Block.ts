import { Transaction } from './Transaction';

const MAX_BLOCK_SIZE = 1024 * 1024; // 1 MB

export class Block {
  public readonly timestamp: number;
  public readonly transactions: Transaction[];
  public readonly prevHash: string;
  public readonly hash: string;
  public readonly nonce: number;

  constructor(
    timestamp: number,
    transactions: Transaction[],
    prevHash: string,
    hash: string,
    nonce: number
  ) {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.prevHash = prevHash;
    this.hash = hash;
    this.nonce = nonce;
  }

  get size(): number {
    // Calculate the size of the block in bytes
    return JSON.stringify(this).length;
  }

  isValid(): boolean {
    // Check if the block size is within the limit
    return this.size <= MAX_BLOCK_SIZE;
  }
}