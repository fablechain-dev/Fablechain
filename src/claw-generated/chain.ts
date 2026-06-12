import { Block } from '../blockchain/block';
import { Transaction } from '../blockchain/transaction';
import { Account } from '../blockchain/account';

export class Chain {
  private blocks: Block[] = [];
  private accounts: Account[] = [];

  addBlock(block: Block): void {
    // Check if block is valid
    // Add block to chain
    // Update account state
  }

  handleReorg(newBlocks: Block[]): void {
    // Find common ancestor block between current and new chain
    const commonAncestor = this.findCommonAncestor(newBlocks);

    // Revert current chain's transactions after the common ancestor
    this.revertTransactions(commonAncestor.index + 1);

    // Replay transactions from new longer chain
    for (const block of newBlocks.slice(commonAncestor.index + 1)) {
      this.addBlock(block);
    }

    // Update the chain and account state
    this.blocks = newBlocks;
  }

  private findCommonAncestor(newBlocks: Block[]): Block {
    // Iterate through both chains to find the common ancestor block
    // Return the common ancestor block
  }

  private revertTransactions(startIndex: number): void {
    // Revert transactions starting from the given index
    // Update account state accordingly
  }

  getBlocks(): Block[] {
    return this.blocks;
  }

  getAccounts(): Account[] {
    return this.accounts;
  }
}