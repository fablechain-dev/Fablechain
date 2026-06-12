import { Block, Transaction } from './block';
import { Checkpoint, CheckpointManager } from './checkpoint';

export class Blockchain {
  private chain: Block[];
  private pendingTransactions: Transaction[];
  private confirmationThreshold: number;
  private checkpointManager: CheckpointManager;

  constructor(confirmationThreshold: number) {
    this.chain = [];
    this.pendingTransactions = [];
    this.confirmationThreshold = confirmationThreshold;
    this.checkpointManager = new CheckpointManager();
  }

  addBlock(block: Block): void {
    this.chain.push(block);
    this.checkpointManager.addCheckpoint(block);
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

  getCheckpointByBlockNumber(blockNumber: number): Checkpoint | undefined {
    return this.checkpointManager.getCheckpointByNumber(blockNumber);
  }
}

export interface FinalizationStatus {
  finalized: boolean;
  confirmations: number;
}