import { Transaction } from './Transaction';

export class Block {
  public readonly number: number;
  public readonly timestamp: number;
  public readonly transactions: Transaction[];
  public readonly previousHash: string;
  public readonly hash: string;

  constructor(
    number: number,
    timestamp: number,
    transactions: Transaction[],
    previousHash: string
  ) {
    this.number = number;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  private calculateHash(): string {
    // Implement hash calculation logic here
    return '';
  }

  public isValid(): boolean {
    // Implement block validation logic here
    return true;
  }

  public serialize(): string {
    // Implement block serialization logic here
    return JSON.stringify(this);
  }
}