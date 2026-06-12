export class Block {
  public readonly id: string;
  public readonly timestamp: number;
  public readonly transactions: any[];
  public readonly previousHash: string;
  public readonly hash: string;
  public readonly confirmations: number;

  constructor(
    id: string,
    timestamp: number,
    transactions: any[],
    previousHash: string,
    hash: string
  ) {
    this.id = id;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = hash;
    this.confirmations = 0;
  }

  public incrementConfirmations(): void {
    this.confirmations++;
  }

  public isFinalized(requiredConfirmations: number): boolean {
    return this.confirmations >= requiredConfirmations;
  }
}