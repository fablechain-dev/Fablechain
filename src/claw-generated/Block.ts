import { Transaction } from '../blockchain/Transaction';
import { BlockHeader } from '../blockchain/BlockHeader';
import { SHA256 } from 'crypto-js';

export class Block {
  header: BlockHeader;
  transactions: Transaction[];
  hash: string;

  constructor(header: BlockHeader, transactions: Transaction[]) {
    this.header = header;
    this.transactions = transactions;
    this.hash = this.computeHash();
  }

  computeHash(): string {
    const blockData = this.header.toString() + this.transactions.map(tx => tx.toString()).join('');
    return SHA256(blockData).toString();
  }

  isValid(): boolean {
    // Check header validity
    if (!this.header.isValid()) {
      return false;
    }

    // Check transaction validity
    for (const tx of this.transactions) {
      if (!tx.isValid()) {
        return false;
      }
    }

    // Check hash
    return this.hash === this.computeHash();
  }

  serialize(): string {
    return JSON.stringify({
      header: this.header,
      transactions: this.transactions,
      hash: this.hash
    });
  }

  static deserialize(serializedBlock: string): Block {
    const { header, transactions, hash } = JSON.parse(serializedBlock);
    return new Block(
      new BlockHeader(header),
      transactions.map(tx => new Transaction(tx))
    );
  }
}