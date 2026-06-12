import { Transaction } from '../transaction/Transaction';

export class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public previousHash: string;
  public hash: string;
  public nonce: number;
  public finalized: boolean;
  public finalizedAt: number;

  constructor(
    index: number,
    timestamp: number,
    transactions: Transaction[],
    previousHash: string,
    hash: string,
    nonce: number
  ) {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = hash;
    this.nonce = nonce;
    this.finalized = false;
    this.finalizedAt = 0;
  }

  public finalizeBlock(confirmations: number): void {
    this.finalized = true;
    this.finalizedAt = Date.now();
  }
}