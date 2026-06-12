import { Transaction } from './transaction';

export class Block {
  hash: string;
  number: number;
  timestamp: number;
  transactions: Transaction[];
  parentHash: string;
  difficulty: number;
  nonce: number;
  uncles: Block[];
  reward: number;

  constructor(
    hash: string,
    number: number,
    timestamp: number,
    transactions: Transaction[],
    parentHash: string,
    difficulty: number,
    nonce: number,
    uncles: Block[] = []
  ) {
    this.hash = hash;
    this.number = number;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.parentHash = parentHash;
    this.difficulty = difficulty;
    this.nonce = nonce;
    this.uncles = uncles;
    this.reward = this.calculateReward();
  }

  isUncle(block: Block): boolean {
    return this.parentHash === block.parentHash && this.number === block.number - 1;
  }

  getUncleReward(block: Block): number {
    const distance = this.number - block.number;
    return 8 - distance;
  }

  calculateReward(): number {
    // Calculate the total transaction fees
    const totalFees = this.transactions.reduce((sum, tx) => sum + tx.fee, 0);
    // Add the fees to the base block reward
    return 10 + totalFees;
  }

  validateTransactions(): boolean {
    // Validate all transactions in the block
    return this.transactions.every((tx) => tx.validateBalance(tx.from) && tx.validateNonce(tx.from));
  }
}