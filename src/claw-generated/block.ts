// block.ts

import { Transaction, TransactionReceipt } from './transaction';

export class Block {
  transactions: Transaction[] = [];

  addTransaction(tx: Transaction) {
    this.transactions.push(tx);
    tx.emit('transaction_added', { blockNumber: this.number });
  }

  mine() {
    // Mine the block
    // ...

    // Emit a block mined event
    for (const tx of this.transactions) {
      tx.emit('block_mined', { blockNumber: this.number });
    }

    return new BlockReceipt(
      this.hash,
      this.transactions.map(tx => tx.getReceipt())
    );
  }
}

export class BlockReceipt {
  constructor(
    public blockHash: string,
    public transactionReceipts: TransactionReceipt[]
  ) {}

  getBloomFilter(): number[] {
    return this.transactionReceipts.flatMap(r => r.getBloomFilter());
  }
}