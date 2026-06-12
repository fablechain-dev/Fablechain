import { Account } from './Account';
import { MerklePatriciaTrie } from './merkle_patricia_trie';
import { Transaction } from './Transaction';
import { Block } from './Block';
import { StateSnapshot } from './StateSnapshot';
import { Checkpoint } from './checkpoint';
import { StorageService } from './services/StorageService';

export class StateManager {
  private trie: MerklePatriciaTrie;
  private blockStateMap: Map<number, { root: string; diff: Map<string, Account> }>;
  private storageService: StorageService;
  private snapshotInterval: number = 1000; // Take a snapshot every 1000 blocks

  constructor(storageService: StorageService) {
    this.trie = new MerklePatriciaTrie();
    this.blockStateMap = new Map();
    this.storageService = storageService;
  }

  getAccount(address: string): Account {
    const accountData = this.trie.get(address);
    return accountData ? Account.fromData(accountData) : new Account();
  }

  updateAccount(address: string, account: Account): void {
    this.trie.set(address, account.toData());
  }

  getStateRoot(): string {
    return this.trie.getRoot();
  }

  async applyTransaction(tx: Transaction, block: Block): Promise<void> {
    // Apply transaction to state
    this.trie.set(tx.from, this.getAccount(tx.from).toData());
    this.trie.set(tx.to, this.getAccount(tx.to).toData());

    // Record state diff for this block
    const stateRoot = this.trie.getRoot();
    const stateDiff = this.getStateDiff(block.height - 1, block.height);
    this.blockStateMap.set(block.height, { root: stateRoot, diff: stateDiff });

    // Check if it's time to take a state snapshot
    if (block.height % this.snapshotInterval === 0) {
      await this.takeStateSnapshot(block.height, stateRoot, stateDiff);
    }
  }

  getStateDiff(fromHeight: number, toHeight: number): Map<string, Account> {
    const diff = new Map();

    // Iterate through the block state map and calculate the state diff
    for (let i = fromHeight; i < toHeight; i++) {
      const blockState = this.blockStateMap.get(i);
      if (blockState) {
        for (const [address, account] of blockState.diff) {
          diff.set(address, account);
        }
      }
    }

    return diff;
  }

  async takeStateSnapshot(blockNumber: number, stateRoot: string, stateDiff: Map<string, Account>): Promise<void> {
    const snapshot = new StateSnapshot(blockNumber, stateRoot, stateDiff);
    const snapshotData = await snapshot.compress();
    await this.storageService.storeStateSnapshot(blockNumber, snapshotData);

    // Create a checkpoint for the snapshot
    const checkpoint = new Checkpoint(blockNumber, stateRoot, Date.now());
    await this.storageService.storeCheckpoint(checkpoint);
  }

  async loadStateSnapshot(blockNumber: number): Promise<StateSnapshot | null> {
    const snapshotData = await this.storageService.getStateSnapshot(blockNumber);
    if (snapshotData) {
      return await StateSnapshot.decompress(snapshotData);
    }
    return null;
  }
}