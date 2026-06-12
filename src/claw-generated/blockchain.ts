import { Block, Transaction } from './block';

export class Blockchain {
  private chain: Block[];
  private pendingTransactions: Transaction[];
  private confirmationThreshold: number;

  constructor(confirmationThreshold: number) {
    this.chain = [];
    this.pendingTransactions = [];
    this.confirmationThreshold = confirmationThreshold;
  }

  addBlock(block: Block): void {
    this.chain.push(block);
    this.pendingTransactions = [];
  }

  addTransaction(transaction: Transaction): void {
    this.pendingTransactions.push(transaction);
  }

  getFinalizationStatus(blockHash: string): FinalizationStatus {
    const block = this.chain.find((b) => b.hash === blockHash);
    if (!block) {
      return { finalized: false, confirmations: 0 };
    }

    const confirmations = this.chain.length - this.chain.findIndex((b) => b.hash === blockHash);
    const finalized = confirmations >= this.confirmationThreshold;
    return { finalized, confirmations };
  }
}

export interface FinalizationStatus {
  finalized: boolean;
  confirmations: number;
}