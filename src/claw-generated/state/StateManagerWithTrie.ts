import { AccountState } from './AccountState';
import { BlockStore, BlockStoreError } from './BlockStore';
import { StateDiffManager, AccountStateDiff, BlockStateDiff } from './StateDiffManager';
import { MerklePatriciaTrie } from '../merkle-patricia-trie';

class StateManagerWithTrie extends StateManager {
  private trie: MerklePatriciaTrie;

  constructor(blockStore: BlockStore) {
    super(blockStore);
    this.trie = new MerklePatriciaTrie();
  }

  async getAccountState(address: string): Promise<AccountState> {
    const accountState = await super.getAccountState(address);
    const accountData = await this.trie.get(address);
    if (accountData) {
      accountState.data = accountData;
    }
    return accountState;
  }

  async updateAccountState(address: string, newState: AccountState): Promise<void> {
    await super.updateAccountState(address, newState);
    await this.trie.set(address, newState.data);
  }

  async getAccountProof(address: string): Promise<MerkleProof> {
    return await this.trie.getProof(address);
  }

  async verifyAccountProof(address: string, proof: MerkleProof): Promise<boolean> {
    return await this.trie.verifyProof(address, proof);
  }

  async pruneAccountState(): Promise<void> {
    await super.pruneAccountState();
    await this.trie.prune();
  }
}

export { StateManagerWithTrie };