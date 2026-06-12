export class Block {
  index: number;
  timestamp: number;
  transactions: any[];
  previousHash: string;
  hash: string;
  nonce: number;
  size: number; // New property to track block size

  constructor(
    index: number,
    timestamp: number,
    transactions: any[],
    previousHash: string,
    hash: string,
    nonce: number,
    size: number // New parameter for block size
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = hash;
    this.nonce = nonce;
    this.size = size; // Assign the block size
  }

  // New method to validate block size
  validateSize(maxBlockSize: number): boolean {
    return this.size <= maxBlockSize;
  }
}