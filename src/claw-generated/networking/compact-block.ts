import { Block } from '../blockchain/block';
import { Transaction } from '../transaction';

export class CompactBlock {
  header: any;
  shortTransactionIDs: string[];

  constructor(block: Block) {
    this.header = block.header;
    this.shortTransactionIDs = block.transactions.map(tx => tx.hash().slice(0, 8));
  }

  getFullTransactions(knownTransactions: Map<string, Transaction>): Transaction[] {
    return this.shortTransactionIDs.map(txId => {
      const fullTx = knownTransactions.get(txId);
      if (!fullTx) {
        throw new Error(`Unknown transaction: ${txId}`);
      }
      return fullTx;
    });
  }
}