import { Transaction } from '../model/Transaction';

export class Block {
  timestamp: number;
  transactions: Transaction[];
  prevHash: string;
  hash: string;

  constructor(timestamp: number, transactions: Transaction[], prevHash: string) {
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.prevHash = prevHash;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    // Implement hash calculation logic
    return '';
  }

  isValid(): boolean {
    // Implement block validation logic
    return true;
  }
}