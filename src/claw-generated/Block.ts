export class Block {
  public readonly index: number;
  public readonly timestamp: number;
  public readonly transactions: any[];
  public readonly previousHash: string;
  public hash: string;
  public isFinalized: boolean;

  constructor(
    index: number,
    timestamp: number,
    transactions: any[],
    previousHash: string
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.isFinalized = false;
  }

  private calculateHash(): string {
    // Implement hash calculation logic here
    return '';
  }
}