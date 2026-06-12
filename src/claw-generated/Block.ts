export class Block {
  hash: string;
  prevHash: string;
  timestamp: number;
  transactions: Transaction[];
  confirmations: number;

  constructor(prevHash: string, transactions: Transaction[]) {
    this.prevHash = prevHash;
    this.transactions = transactions;
    this.timestamp = Date.now();
    this.confirmations = 0;
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    // Implement hash calculation logic here
    return "placeholder_hash";
  }

  incrementConfirmations(): void {
    this.confirmations++;
  }

  isFinalized(minConfirmations: number): boolean {
    return this.confirmations >= minConfirmations;
  }
}