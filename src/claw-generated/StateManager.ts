import { Account } from '../account/Account';
import { Block } from '../block/Block';
import { Transaction } from '../transaction/Transaction';
import { StateSnapshotManager } from './StateSnapshotManager';

export class StateManager {
  private accounts: Map<string, Account> = new Map();
  private stateRoot: string = '';
  private snapshotManager: StateSnapshotManager;
  private pruningInterval: number;

  constructor(snapshotManager: StateSnapshotManager, pruningInterval: number) {
    this.snapshotManager = snapshotManager;
    this.pruningInterval = pruningInterval;
  }

  applyTransaction(tx: Transaction): void {
    const sender = this.getAccount(tx.from);
    const receiver = this.getAccount(tx.to);

    sender.balance -= tx.amount;
    receiver.balance += tx.amount;

    this.updateStateRoot();
  }

  applyBlock(block: Block): void {
    for (const tx of block.transactions) {
      this.applyTransaction(tx);
    }

    this.updateStateRoot();
    this.maybeCreateSnapshot(block);
    this.maybePruneState(block.number);
  }

  getAccount(address: string): Account {
    if (!this.accounts.has(address)) {
      this.accounts.set(address, new Account(address, 0));
    }
    return this.accounts.get(address)!;
  }

  getStateRoot(): string {
    return this.stateRoot;
  }

  private updateStateRoot(): void {
    // TODO: Implement state root calculation
    this.stateRoot = 'abc123';
  }

  private maybeCreateSnapshot(block: Block): void {
    if (block.number % this.pruningInterval === 0) {
      this.snapshotManager.createSnapshot(block);
    }
  }

  private maybePruneState(blockNumber: number): void {
    if (blockNumber % this.pruningInterval === 0) {
      this.pruneStateData(blockNumber - this.pruningInterval);
    }
  }

  private pruneStateData(blockNumber: number): void {
    // Remove state data for blocks older than the pruning interval
    // This may involve deleting accounts, transactions, and other state data
    // Use the StateSnapshotManager to handle the pruning process
  }
}