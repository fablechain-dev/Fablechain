import { Block } from '../blockchain/block';
import { Transaction } from '../blockchain/transaction';

export class BlockChain {
  private chain: Block[] = [];

  constructor() {
    // Initialize the genesis block
    this.chain.push(new Block(0, [], 0));
  }

  isChainValid(): boolean {
    // ... existing isChainValid() implementation
  }

  getLongestValidChain(newChain: Block[]): Block[] {
    // ... existing getLongestValidChain() implementation
  }

  revertAndReplayTransactions(newChain: Block[]): void {
    // ... existing revertAndReplayTransactions() implementation
  }

  handleChainReorg(newChain: Block[]): void {
    const longestValidChain = this.getLongestValidChain(newChain);

    if (longestValidChain !== this.chain) {
      console.log('Chain reorganization detected. Reverting and replaying transactions.');
      this.revertAndReplayTransactions(longestValidChain);
    } else {
      console.log('New chain is not longer than current chain. No reorganization needed.');
    }
  }

  // Other methods for adding blocks, etc.
}