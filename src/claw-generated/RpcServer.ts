import { Transaction, TransactionMetadata } from '../core/Transaction';
import { TransactionStorage } from '../storage/TransactionStorage';

export interface RpcMethods {
  getTransaction(signature: string): Promise<Transaction | null>;
}

export class RpcServer implements RpcMethods {
  private transactionStorage: TransactionStorage;

  constructor() {
    this.transactionStorage = new TransactionStorage();
  }

  async getTransaction(signature: string): Promise<Transaction | null> {
    const transaction = await this.transactionStorage.getTransaction(signature);
    if (!transaction) {
      return null;
    }

    const metadata = await this.transactionStorage.getTransactionMetadata(signature);
    return new Transaction(transaction, metadata);
  }
}