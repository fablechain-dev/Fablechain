import { Transaction } from './Transaction';
import { sha256 } from 'js-sha256';

export class Block {
  public readonly timestamp: number;
  public readonly transactions: Transaction[];
  public readonly previousHash: string;
  public readonly hash: string;

  constructor(timestamp: number, transactions: Transaction[], previousHash: string) {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  private calculateHash(): string {
    const transactionsData = this.transactions.map(tx => tx.serialize()).join('');
    const data = `${this.timestamp}${transactionsData}${this.previousHash}`;
    return sha256(data);
  }

  public isValid(): boolean {
    return this.hash === this.calculateHash();
  }

  public serialize(): string {
    return JSON.stringify(this);
  }
}