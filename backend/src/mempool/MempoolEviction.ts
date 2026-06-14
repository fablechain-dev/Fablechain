```typescript
import { EventEmitter } from 'events';

export interface MempoolTransaction {
  id: string;
  hash: string;
  feeRate: bigint;
  size: number;
  timestamp: number;
  nonce: number;
  from: string;
}

export interface EvictionConfig {
  maxPoolSize: number;
  ttlSeconds: number;
  minFeeRate: bigint;
  checkIntervalMs: number;
}

export interface EvictionStats {
  totalEvicted: number;
  evictedByTTL: number;
  evictedBySize: number;
  evictedByFeeRate: number;
  currentPoolSize: number;
  currentMemoryUsage: number;
}

export class MempoolEviction extends EventEmitter {
  private transactions: Map<string, MempoolTransaction> = new Map();
  private config: EvictionConfig;
  private stats: EvictionStats;
  private evictionTimer: NodeJS.Timeout | null = null;
  private addressNonces: Map<string, number> = new Map();

  constructor(config: Partial<EvictionConfig> = {}) {
    super();
    
    this.config = {
      maxPoolSize: config.maxPoolSize || 10_000_000,
      ttlSeconds: config.ttlSeconds || 3600,
      minFeeRate: config.minFeeRate || BigInt(1),
      checkIntervalMs: config.checkIntervalMs || 30_000,
    };

    this.stats = {
      totalEvicted: 0,
      evictedByTTL: 0,
      evictedBySize: 0,
      evictedByFeeRate: 0,
      currentPoolSize: 0,
      currentMemoryUsage: 0,
    };

    this.startEvictionCycle();
  }

  public addTransaction(tx: MempoolTransaction): void {
    if (this.transactions.has(tx.id)) {
      return;
    }

    const currentNonce = this.addressNonces.get(tx.from) || 0;
    if (tx.nonce < currentNonce) {
      throw new Error(`Transaction nonce ${tx.nonce} is below current nonce ${currentNonce}`);
    }

    this.transactions.set(tx.id, tx);
    this.addressNonces.set(tx.from, Math.max(currentNonce, tx.nonce));
    this.stats.currentPoolSize += tx.size;
    this.stats.currentMemoryUsage = this.calculateMemoryUsage();

    this.enforceCapacity();
  }

  public removeTransaction(txId: string): boolean {
    const tx = this.transactions.get(txId);
    if (!tx) {
      return false;
    }

    this.transactions.delete(txId);
    this.stats.currentPoolSize -= tx.size;
    this.stats.currentMemoryUsage = this.calculateMemoryUsage();
    return true;
  }

  public getTransaction(txId: string): MempoolTransaction | undefined {
    return this.transactions.get(txId);
  }

  public getAllTransactions(): MempoolTransaction[] {
    return Array.from(this.transactions.values());
  }

  public getTransactionsByAddress(address: string): MempoolTransaction[] {
    return Array.from(this.transactions.values()).filter(
      (tx) => tx.from === address
    );
  }

  public getPoolStats(): EvictionStats {
    return { ...this.stats };
  }

  public getPoolSize(): number {
    return this.transactions.size;
  }

  public getMemoryUsage(): number {
    return this.stats.currentMemoryUsage;
  }

  private startEvictionCycle(): void {
    this.evictionTimer = setInterval(() => {
      this.performEvictionCheck();
    }, this.config.checkIntervalMs);
  }

  private performEvictionCheck(): void {
    const now = Date.now() / 1000;
    
    this.evictExpiredTransactions(now);
    this.enforceCapacity();
    this.enforceMinimumFeeRate();
  }

  private evictExpiredTransactions(now: number): void {
    const expiredTxs: string[] = [];

    for (const [txId, tx] of this.transactions.entries()) {
      const age = now - tx.timestamp;
      if (age > this.config.ttlSeconds) {
        expiredTxs.push(txId);
      }
    }

    for (const txId of expiredTxs) {
      const tx = this.transactions.get(txId);
      if (tx) {
        this.transactions.delete(txId);
        this.stats.currentPoolSize -= tx.size;
        this.stats.evictedByTTL++;
        this.stats.totalEvicted++;
        this.emit('evicted', { txId, reason: 'ttl_expired', tx });
      }
    }

    this.stats.currentMemoryUsage = this.calculateMemoryUsage();
  }

  private enforceCapacity(): void {
    while (this.stats.currentPoolSize > this.config.maxPoolSize) {
      const toEvict = this.selectLRUTransaction();
      if (!toEvict) {
        break;
      }

      this.transactions.delete(toEvict.id);
      this.stats.currentPoolSize -= toEvict.size;
      this.stats.evictedBySize++;
      this.stats.totalEvicted++;
      this.emit('evicted', { txId: toEvict.id, reason: 'size_cap', tx: toEvict });
    }

    this.stats.currentMemoryUsage = this.calculateMemoryUsage();
  }

  private enforceMinimumFeeRate(): void {
    const lowFeeTxs: string[] = [];

    for (const [txId, tx] of this.transactions.entries()) {
      if (tx.feeRate < this.config.minFeeRate) {
        lowFeeTxs.push(txId);
      }
    }

    for (const txId of lowFeeTxs) {
      const tx = this.transactions.get(txId);
      if (tx) {
        this.transactions.delete(txId);
        this.stats.currentPoolSize -= tx.size;
        this.stats.evictedByFeeRate++;
        this.stats.totalEvicted++;
        this.emit('evicted', { txId, reason: 'low_fee_rate', tx });
      }
    }

    this.stats.currentMemoryUsage = this.calculateMemoryUsage();
  }

  private selectLRUTransaction(): MempoolTransaction | null {
    let oldestTx: MempoolTransaction | null = null;
    let oldestTimestamp = Infinity;

    for (const tx of this.transactions.values()) {
      if (tx.timestamp < oldestTimestamp) {
        oldestTimestamp = tx.timestamp;
        oldestTx = tx;
      }
    }

    return oldestTx;
  }

  private calculateMemoryUsage(): number {
    let total = 0;
    for (const tx of this.transactions.values()) {
      total += tx.size;
    }
    return total;
  }

  public reset(): void {
    this.transactions.clear();
    this.addressNonces.clear();
    this.stats = {
      totalEvicted: 0,
      evictedByTTL: 0,
      evictedBySize: 0,
      evictedByFeeRate: 0,
      currentPoolSize: 0,
      currentMemoryUsage: 0,
    };
  }

  public destroy(): void {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
      this.evictionTimer = null;
    }
    this.removeAllListeners();
    this.reset();
  }

  public updateConfig(partialConfig: Partial<EvictionConfig>): void {
    this.config = {
      ...this.config,
      ...partialConfig,
    };