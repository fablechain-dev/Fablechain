```typescript
import { EventEmitter } from 'events';

export interface RateLimiterConfig {
  rate: number;
  burst: number;
  window?: number;
  maxKeys?: number;
}

export interface TokenBucketState {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter extends EventEmitter {
  private readonly rate: number;
  private readonly burst: number;
  private readonly window: number;
  private readonly maxKeys: number;
  private buckets: Map<string, TokenBucketState>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(config: RateLimiterConfig) {
    super();
    
    if (config.rate <= 0) {
      throw new Error('Rate must be greater than 0');
    }
    if (config.burst < 1) {
      throw new Error('Burst must be at least 1');
    }
    if (config.burst < config.rate) {
      throw new Error('Burst capacity must be >= rate');
    }

    this.rate = config.rate;
    this.burst = config.burst;
    this.window = config.window ?? 1000;
    this.maxKeys = config.maxKeys ?? 10000;
    this.buckets = new Map();
    this.cleanupInterval = null;
  }

  public start(): void {
    if (this.cleanupInterval !== null) {
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.window * 5);

    this.cleanupInterval.unref?.();
  }

  public stop(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.buckets.clear();
  }

  public async acquire(key: string, tokens: number = 1): Promise<boolean> {
    if (tokens <= 0) {
      throw new Error('Tokens to acquire must be greater than 0');
    }

    if (tokens > this.burst) {
      throw new Error(`Cannot acquire ${tokens} tokens, burst capacity is ${this.burst}`);
    }

    const bucket = this.getOrCreateBucket(key);
    this.refill(bucket);

    if (bucket.tokens >= tokens) {
      bucket.tokens -= tokens;
      this.emit('acquire', { key, tokens, remaining: bucket.tokens });
      return true;
    }

    this.emit('reject', { key, tokens, available: bucket.tokens });
    return false;
  }

  public async tryAcquire(
    key: string,
    tokens: number = 1,
    maxWait: number = 0
  ): Promise<boolean> {
    if (tokens <= 0) {
      throw new Error('Tokens to acquire must be greater than 0');
    }

    const startTime = Date.now();

    while (true) {
      const bucket = this.getOrCreateBucket(key);
      this.refill(bucket);

      if (bucket.tokens >= tokens) {
        bucket.tokens -= tokens;
        this.emit('acquire', { key, tokens, remaining: bucket.tokens });
        return true;
      }

      if (maxWait <= 0) {
        this.emit('reject', { key, tokens, available: bucket.tokens });
        return false;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed >= maxWait) {
        this.emit('reject', { key, tokens, available: bucket.tokens });
        return false;
      }

      const tokensNeeded = tokens - bucket.tokens;
      const refillTime = (tokensNeeded / this.rate) * this.window;
      const waitTime = Math.min(refillTime, maxWait - elapsed);

      await this.delay(Math.ceil(waitTime));
    }
  }

  public reset(key: string): void {
    this.buckets.delete(key);
    this.emit('reset', { key });
  }

  public resetAll(): void {
    this.buckets.clear();
    this.emit('resetAll');
  }

  public getState(key: string): TokenBucketState | null {
    const bucket = this.buckets.get(key);
    if (!bucket) {
      return null;
    }

    const copy = { ...bucket };
    this.refill(copy);
    return copy;
  }

  public getStats(): {
    activeKeys: number;
    maxKeys: number;
    rate: number;
    burst: number;
  } {
    return {
      activeKeys: this.buckets.size,
      maxKeys: this.maxKeys,
      rate: this.rate,
      burst: this.burst,
    };
  }

  private getOrCreateBucket(key: string): TokenBucketState {
    let bucket = this.buckets.get(key);

    if (!bucket) {
      if (this.buckets.size >= this.maxKeys) {
        throw new Error(`Maximum number of keys (${this.maxKeys}) exceeded`);
      }

      bucket = {
        tokens: this.burst,
        lastRefill: Date.now(),
      };

      this.buckets.set(key, bucket);
    }

    return bucket;
  }

  private refill(bucket: TokenBucketState): void {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = (timePassed / this.window) * this.rate;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(
        this.burst,
        bucket.tokens + tokensToAdd
      );
      bucket.lastRefill = now;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const staleThreshold = this.window * 10;
    const keysToDelete: string[] = [];

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > staleThreshold && bucket.tokens >= this.burst) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.buckets.delete(key);
    }

    if (keysToDelete.length > 0) {
      this.emit('cleanup', { removed: keysToDelete.length });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class RateLimiterPool {
  private limiters: Map<string, RateLimiter>;

  constructor(private defaultConfig: RateLimiterConfig) {
    this.limiters = new Map();
  }

  public getLimiter(name: string, config?: RateLimiterConfig): RateLimiter {
    let limiter = this.limiters.get(name);

    if (!limiter) {
      const finalConfig = config ?? this.defaultConfig;
      limiter = new RateLimiter(finalConfig);
      limiter.start();
      this.limiters.set(name, limiter);
    }

    return limiter;
  }

  public shutdown(): void {
    for (const limiter of this.limiters.values()) {
      limiter.stop();
    }
    this.limiters.clear();
  }
}
```