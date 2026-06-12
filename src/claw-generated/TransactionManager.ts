import { Transaction } from './Transaction';
import { CacheManager } from './CacheManager';

class TransactionManager {
  private cache: CacheManager<Transaction>;

  constructor() {
    this.cache = new CacheManager<Transaction>(5000, 60); // cache size 5000, expiration 60 seconds
  }

  async getTransaction(hash: string): Promise<Transaction | null> {
    const cachedTransaction = this.cache.get(hash);
    if (cachedTransaction) {
      return cachedTransaction;
    }

    const transaction = await this.fetchTransactionFromDatabase(hash);
    if (transaction) {
      this.cache.set(hash, transaction);
    }
    return transaction;
  }

  async fetchTransactionFromDatabase(hash: string): Promise<Transaction | null> {
    // Fetch transaction from database
    // ...
    return null;
  }
}

export { TransactionManager };