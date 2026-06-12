import { StateManagerWithTrie } from './StateManagerWithTrie';
import { StorageService } from './services/StorageService';

export class StateManager {
  private stateManagerWithTrie: StateManagerWithTrie;

  constructor(storageService: StorageService) {
    this.stateManagerWithTrie = new StateManagerWithTrie(storageService);
  }

  getAccount(address: string): Account {
    return this.stateManagerWithTrie.getAccount(address);
  }

  updateAccount(address: string, account: Account): void {
    this.stateManagerWithTrie.updateAccount(address, account);
  }

  getStateRoot(): Uint8Array {
    return this.stateManagerWithTrie.getStateRoot();
  }

  async applyTransaction(tx: Transaction, block: Block): Promise<void> {
    await this.stateManagerWithTrie.applyTransaction(tx, block);
  }

  getStateDiff(fromHeight: number, toHeight: number): Map<string, Account> {
    return this.stateManagerWithTrie.getStateDiff(fromHeight, toHeight);
  }

  async takeStateSnapshot(blockNumber: number): Promise<void> {
    const stateRoot = this.getStateRoot();
    const stateDiff = this.getStateDiff(blockNumber - 1, blockNumber);
    await this.stateManagerWithTrie.takeStateSnapshot(blockNumber, stateRoot, stateDiff);
  }

  async loadStateSnapshot(blockNumber: number): Promise<StateSnapshot | null> {
    return await this.stateManagerWithTrie.loadStateSnapshot(blockNumber);
  }
}