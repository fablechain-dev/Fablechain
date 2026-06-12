import { Transaction, TransactionReceipt } from './Transaction';

export class Block {
  transactions: Transaction[];
  receipts: TransactionReceipt[];

  constructor(transactions: Transaction[]) {
    this.transactions = transactions;
    this.receipts = transactions.map(tx => tx.generateReceipt());
  }
}