import { AccountState } from './AccountState';
import { BlockStore, BlockStoreError } from './BlockStore';

class StateManager {
  private accountState: Map<string, AccountState> = new Map();
  private blockStore: BlockStore;

  constructor(blockStore: BlockStore) {
    this.blockStore = blockStore;
  }

  async getAccountState(address: string): Promise<AccountState> {
    if (this.accountState.has(address)) {
      return this.accountState.get(address)!;
    }

    // Fetch account state from storage and cache it
    const accountState = await this.fetchAccountState(address);
    this.accountState.set(address, accountState);
    return accountState;
  }

  async getBlock(slot: number): Promise<Block> {
    return await this.blockStore.getBlock(slot);
  }

  private async fetchAccountState(address: string): Promise<AccountState> {
    // Implement fetching account state from storage
    return new AccountState({
      owner: address,
      lamports: 1000,
      data: [],
      executable: false,
      rent_epoch: 0,
    });
  }

  async pruneAccountState(): Promise<void> {
    // Implement account state pruning logic
    // - Remove old transaction signatures based on a configurable retention policy
    // - Consider other account state data that can be safely pruned
  }

  async pruneBlockState(): Promise<void> {
    // Implement block state pruning logic
    // - Remove old block data based on a configurable retention policy
    // - Preserve necessary checkpoints for historical data
  }
}

export { StateManager };