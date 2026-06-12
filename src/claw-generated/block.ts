export class Block {
  hash: string;
  prevHash: string;
  timestamp: number;
  transactions: Transaction[];
  finalized: boolean = false;

  constructor(
    hash: string,
    prevHash: string,
    timestamp: number,
    transactions: Transaction[]
  ) {
    this.hash = hash;
    this.prevHash = prevHash;
    this.timestamp = timestamp;
    this.transactions = transactions;
  }
}