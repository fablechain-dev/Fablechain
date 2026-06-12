import { Account } from './Account';
import { MerklePatriciaTrie } from './merkle_patricia_trie';
import { Transaction } from './Transaction';
import { Block } from './Block';

export class StateManager {
  private trie: MerklePatriciaTrie;
  private blockStateMap: Map<number, { root: string; diff: Map<string, Account> }>;

  constructor() {
    this.trie = new MerklePatriciaTrie();
    this.blockStateMap = new Map();
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

  applyTransaction(tx: Transaction, block: Block): void {
    // Apply transaction to state
    this.trie.set(tx.from, this.getAccount(tx.from).toData());
    this.trie.set(tx.to, this.getAccount(tx.to).toData());

    // Record state diff for this block
    const stateRoot = this.trie.getRoot();
    const stateDiff = this.getStateDiff(block.height - 1, block.height);
    this.blockStateMap.set(block.height, { root: stateRoot, diff: stateDiff });
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
}