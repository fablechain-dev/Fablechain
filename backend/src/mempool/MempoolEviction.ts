```typescript
import { EventEmitter } from 'events';

export interface MempoolTransaction {
  txHash: string;
  nonce: number;
  gasPrice: bigint;
  gasLimit: bigint;
  data: string;
  timestamp: number;
  from: string;
  to: string | null;
  value: bigint;
  expiresAt: number;
}

export interface EvictionPolicy {
  maxSize: number;
  ttlSeconds: number;
  minFeeRate: bigint;
}

export interface EvictionMetrics {
  txsEvictedByTTL: number;
  txsEvictedBySize: number;
  txsEvictedByFeeRate: number;
  totalEvicted: number;
  currentPoolSize: number;
  lastEvictionTime: number;
}

export class MempoolEviction extends EventEmitter {
  private transactions: Map<string, MempoolTransaction>;
  private policy: EvictionPolicy;
  private metrics: EvictionMetrics;
  private accessOrder: string[];
  private evictionInterval: NodeJS.Timeout | null;

  constructor(policy: EvictionPolicy) {
    super();
    this.transactions = new Map();
    this.policy = policy;
    this.accessOrder = [];
    this.metrics = {
      txsEvictedByTTL: 0,
      txsEvictedBySize: 0,
      txsEvictedByFeeRate: 0,
      totalEvicted: 0,
      currentPoolSize: 0,
      lastEvictionTime: 0,
    };

    this.startPeriodicEviction();
  }

  private startPeriodicEviction(): void {
    this.evictionInterval = setInterval(() => {
      this.evictExpiredTransactions();
    }, 5000);
  }

  public addTransaction(tx: MempoolTransaction): boolean {
    if (this.transactions.has(tx.txHash)) {
      return false;
    }

    const feeRate = tx.gasPrice / BigInt(tx.gasLimit);
    if (feeRate < this.policy.minFeeRate) {
      this.emit('rejected', {
        txHash: tx.txHash,
        reason: 'Fee rate below minimum',
      });
      return false;
    }

    tx.expiresAt = Date.now() + this.policy.ttlSeconds * 1000;

    this.transactions.set(tx.txHash, tx);
    this.accessOrder.push(tx.txHash);
    this.metrics.currentPoolSize = this.transactions.size;

    if (this.transactions.size > this.policy.maxSize) {
      this.enforceCapacity();
    }

    this.emit('added', { txHash: tx.txHash, poolSize: this.transactions.size });
    return true;
  }

  private enforceCapacity(): void {
    const txsToEvict = this.transactions.size - this.policy.maxSize;

    const txArray = Array.from(this.transactions.values()).sort((a, b) => {
      const feeRateA = a.gasPrice / BigInt(a.gasLimit);
      const feeRateB = b.gasPrice / BigInt(b.gasLimit);

      if (feeRateA !== feeRateB) {
        return Number(feeRateA - feeRateB);
      }

      return a.timestamp - b.timestamp;
    });

    for (let i = 0; i < txsToEvict && i < txArray.length; i++) {
      const tx = txArray[i];
      this.evictTransaction(tx.txHash, 'size_cap');
    }
  }

  private evictExpiredTransactions(): void {
    const now = Date.now();
    const expiredTxs: string[] = [];

    for (const [txHash, tx] of this.transactions.entries()) {
      if (now > tx.expiresAt) {
        expiredTxs.push(txHash);
      }
    }

    for (const txHash of expiredTxs) {
      this.evictTransaction(txHash, 'ttl_expiry');
    }

    if (expiredTxs.length > 0) {
      this.metrics.lastEvictionTime = now;
    }
  }

  private evictTransaction(txHash: string, reason: string): void {
    if (!this.transactions.has(txHash)) {
      return;
    }

    this.transactions.delete(txHash);

    const index = this.accessOrder.indexOf(txHash);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    this.metrics.totalEvicted++;

    if (reason === 'ttl_expiry') {
      this.metrics.txsEvictedByTTL++;
    } else if (reason === 'size_cap') {
      this.metrics.txsEvictedBySize++;
    } else if (reason === 'fee_rate') {
      this.metrics.txsEvictedByFeeRate++;
    }

    this.metrics.currentPoolSize = this.transactions.size;

    this.emit('evicted', {
      txHash,
      reason,
      poolSize: this.transactions.size,
    });
  }

  public getTransaction(txHash: string): MempoolTransaction | undefined {
    const tx = this.transactions.get(txHash);

    if (tx) {
      const index = this.accessOrder.indexOf(txHash);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(txHash);
    }

    return tx;
  }

  public removeTransaction(txHash: string): boolean {
    if (this.transactions.has(txHash)) {
      this.transactions.delete(txHash);

      const index = this.accessOrder.indexOf(txHash);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }

      this.metrics.currentPoolSize = this.transactions.size;
      this.emit('removed', { txHash, poolSize: this.transactions.size });

      return true;
    }

    return false;
  }

  public getPoolSize(): number {
    return this.transactions.size;
  }

  public getMetrics(): EvictionMetrics {
    return { ...this.metrics };
  }

  public updatePolicy(newPolicy: Partial<EvictionPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };

    if (
      newPolicy.maxSize &&
      this.transactions.size > newPolicy.maxSize
    ) {
      this.enforceCapacity();
    }

    this.emit('policyUpdated', this.policy);
  }

  public getHighestFeeTransactions(count: number): MempoolTransaction[] {
    return Array.from(this.transactions.values())
      .sort((a, b) => {
        const feeRateA = a.gasPrice / BigInt(a.gasLimit);
        const feeRateB = b.gasPrice / BigInt(b.gasLimit);
        return Number(feeRateB - feeRateA);
      })
      .slice(0, count);
  }

  public getNonceForAddress(address: string): number | null {
    let maxNonce = -1;

    for (const tx of this.transactions.values()) {
      if (tx.from.toLowerCase() === address.toLowerCase()) {
        maxNonce = Math.max(maxNonce, tx.nonce);
      }
    }

    return maxNonce >= 0 ? maxNonce + 1 : null;
  }

  public validateFeeRate(gasPrice: bigint, gasLimit: bigint): boolean {
    const feeRate = gasPrice / BigInt(gasLimit);
    return feeRate >= this.policy.minFeeRate;
  }

  public destroy(): void {
    if (this.evictionInterval) {
      clearInterval(this.evictionInterval);
    }

    this.transactions.clear();
    this.accessOrder = [];
    this.remove