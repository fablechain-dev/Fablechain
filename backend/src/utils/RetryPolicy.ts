```typescript
import { Logger } from './Logger';

export interface RetryPolicyConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterFactor?: number;
}

export interface RetryAttempt {
  attemptNumber: number;
  totalAttempts: number;
  lastError?: Error;
  nextRetryDelayMs?: number;
}

export type RetryableFunction<T> = () => Promise<T>;
export type OnRetryCallback = (attempt: RetryAttempt) => void | Promise<void>;

export class RetryPolicy {
  private readonly config: Required<RetryPolicyConfig>;
  private readonly logger: Logger;

  constructor(config: RetryPolicyConfig, logger?: Logger) {
    this.config = {
      maxAttempts: config.maxAttempts,
      baseDelayMs: config.baseDelayMs,
      maxDelayMs: config.maxDelayMs,
      jitterFactor: config.jitterFactor ?? 0.1,
    };

    if (this.config.maxAttempts < 1) {
      throw new Error('maxAttempts must be at least 1');
    }
    if (this.config.baseDelayMs < 0) {
      throw new Error('baseDelayMs must be non-negative');
    }
    if (this.config.maxDelayMs < this.config.baseDelayMs) {
      throw new Error('maxDelayMs must be greater than or equal to baseDelayMs');
    }
    if (this.config.jitterFactor < 0 || this.config.jitterFactor > 1) {
      throw new Error('jitterFactor must be between 0 and 1');
    }

    this.logger = logger || new Logger('RetryPolicy');
  }

  /**
   * Calculate delay for exponential backoff with jitter
   */
  private calculateDelayMs(attemptNumber: number): number {
    // Exponential backoff: baseDelay * 2^(attempt-1)
    const exponentialDelay = this.config.baseDelayMs * Math.pow(2, attemptNumber - 1);
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    // Add jitter: random value between -jitterFactor% and +jitterFactor%
    const jitterRange = cappedDelay * this.config.jitterFactor;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;

    return Math.max(0, Math.floor(cappedDelay + jitter));
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: RetryableFunction<T>,
    onRetry?: OnRetryCallback
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await fn();
        if (attempt > 1) {
          this.logger.info(`Operation succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.config.maxAttempts) {
          this.logger.error(
            `Operation failed after ${this.config.maxAttempts} attempts`,
            lastError
          );
          throw lastError;
        }

        const nextDelayMs = this.calculateDelayMs(attempt);
        const attemptInfo: RetryAttempt = {
          attemptNumber: attempt,
          totalAttempts: this.config.maxAttempts,
          lastError,
          nextRetryDelayMs: nextDelayMs,
        };

        this.logger.warn(
          `Attempt ${attempt} failed: ${lastError.message}. ` +
            `Retrying in ${nextDelayMs}ms...`
        );

        if (onRetry) {
          await onRetry(attemptInfo);
        }

        await this.delay(nextDelayMs);
      }
    }

    // Should not reach here, but included for type safety
    throw lastError || new Error('Unknown error during retry attempts');
  }

  /**
   * Execute function with retry logic and timeout per attempt
   */
  async executeWithTimeout<T>(
    fn: RetryableFunction<T>,
    timeoutMs: number,
    onRetry?: OnRetryCallback
  ): Promise<T> {
    return this.execute<T>(async () => {
      return Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
            timeoutMs
          )
        ),
      ]);
    }, onRetry);
  }

  /**
   * Get configuration details
   */
  getConfig(): Readonly<Required<RetryPolicyConfig>> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Create a new retry policy with updated config
   */
  withConfig(updates: Partial<RetryPolicyConfig>): RetryPolicy {
    return new RetryPolicy(
      {
        ...this.config,
        ...updates,
      },
      this.logger
    );
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Static factory for common patterns
   */
  static aggressive(logger?: Logger): RetryPolicy {
    return new RetryPolicy(
      {
        maxAttempts: 10,
        baseDelayMs: 100,
        maxDelayMs: 30000,
        jitterFactor: 0.1,
      },
      logger
    );
  }

  static moderate(logger?: Logger): RetryPolicy {
    return new RetryPolicy(
      {
        maxAttempts: 5,
        baseDelayMs: 500,
        maxDelayMs: 10000,
        jitterFactor: 0.1,
      },
      logger
    );
  }

  static conservative(logger?: Logger): RetryPolicy {
    return new RetryPolicy(
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        jitterFactor: 0.05,
      },
      logger
    );
  }
}
```