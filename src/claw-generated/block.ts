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
  }

  isUncle(block: Block): boolean {
    return this.parentHash === block.parentHash && this.number === block.number - 1;
  }

  getUncleReward(block: Block): number {
    const distance = this.number - block.number;
    return 8 - distance;
  }
}