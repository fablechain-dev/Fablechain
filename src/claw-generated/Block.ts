import { Transaction } from './Transaction';
import { TransactionValidator } from './TransactionValidator';

export class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public previousHash: string;
  public hash: string;
  public nonce: number;
  private readonly MAX_BLOCK_SIZE = 1000000; // 1MB
  private readonly BLOCK_SIZE_ADJUSTMENT_INTERVAL = 10; // Adjust every 10 blocks
  private readonly BLOCK_SIZE_ADJUSTMENT_FACTOR = 1.1; // Increase by 10%

  constructor(
    index: number,
    timestamp: number,
    transactions: Transaction[],
    previousHash: string
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  private calculateHash(): string {
    // Implement hash calculation logic
    return '';
  }

  public mineBlock(difficulty: number): void {
    if (!this.validateBlockSize()) {
      throw new Error('Block size exceeds limit');
    }

    if (!this.validateTransactions()) {
      throw new Error('Invalid transactions in block');
    }

    // Implement proof-of-work mining
  }

  public async validateTransactions(): Promise<boolean> {
    const transactionValidator = new TransactionValidator();
    const validationPromises = this.transactions.map((tx) => transactionValidator.validateTransaction(tx));
    const validationResults = await Promise.all(validationPromises);
    return validationResults.every((result) => result);
  }

  public get size(): number {
    let size = 0;
    for (const tx of this.transactions) {
      size += tx.size;
    }
    return size;
  }

  public validateBlockSize(): boolean {
    return this.size <= this.MAX_BLOCK_SIZE;
  }

  public adjustBlockSize(): void {
    if (this.index > 0 && this.index % this.BLOCK_SIZE_ADJUSTMENT_INTERVAL === 0) {
      this.MAX_BLOCK_SIZE = Math.floor(this.MAX_BLOCK_SIZE * this.BLOCK_SIZE_ADJUSTMENT_FACTOR);
    }
  }
}