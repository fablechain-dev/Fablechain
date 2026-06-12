import { Account } from './Account';
import { MerklePatriciaTrie } from './merkle_patricia_trie';
import { Transaction } from './Transaction';

export class StateManager {
  private trie: MerklePatriciaTrie;

  constructor() {
    this.trie = new MerklePatriciaTrie();
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

  applyTransaction(tx: Transaction): void {
    // Apply transaction to state
    // ...
    this.trie.set(tx.from, this.getAccount(tx.from).toData());
    this.trie.set(tx.to, this.getAccount(tx.to).toData());
  }

  getStateDiff(fromHeight: number, toHeight: number): Map<string, Account> {
    // Calculate the state diff between the two block heights
    // ...
    const diff = new Map();
    const proof = this.trie.prove(fromHeight.toString());
    for (const { key, value } of proof) {
      diff.set(key, Account.fromData(value));
    }
    return diff;
  }
}