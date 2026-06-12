import { Transaction } from './Transaction';

export class Block {
  public readonly id: number;
  public readonly timestamp: number;
  public readonly transactions: Transaction[];
  public readonly previousHash: string;
  public readonly hash: string;
  public readonly size: number;
  public readonly maxSize: number = 1000000; // 1 MB

  constructor(
    id: number,
    timestamp: number,
    transactions: Transaction[],
    previousHash: string,
    hash: string
  ) {
    this.id = id;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = hash;
    this.size = this.calculateBlockSize();
  }

  private calculateBlockSize(): number {
    // Calculate the total size of the block in bytes
    return Buffer.byteLength(JSON.stringify(this));
  }

  public isValid(): boolean {
    // Validate the block size
    if (this.size > this.maxSize) {
      return false;
    }

    // Validate other block properties
    // ...

    return true;
  }
}