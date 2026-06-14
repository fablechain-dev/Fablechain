```typescript
import { EventEmitter } from 'events';

export interface RoundTimerConfig {
  initialTimeoutMs: number;
  maxTimeoutMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
  maxRetries: number;
}

export interface RoundTimerObserver {
  onRoundStart(roundNumber: number): void;
  onRoundTimeout(roundNumber: number, attempt: number): void;
  onRoundComplete(roundNumber: number): void;
  onRoundError(roundNumber: number, error: Error): void;
}

export class RoundTimer extends EventEmitter {
  private config: RoundTimerConfig;
  private currentRound: number = 0;
  private currentAttempt: number = 0;
  private timeoutHandle: NodeJS.Timeout | null = null;
  private observers: Set<RoundTimerObserver> = new Set();
  private roundStartTime: number = 0;
  private isRunning: boolean = false;
  private currentTimeoutMs: number;

  constructor(config: Partial<RoundTimerConfig> = {}) {
    super();
    this.config = {
      initialTimeoutMs: config.initialTimeoutMs ?? 1000,
      maxTimeoutMs: config.maxTimeoutMs ?? 30000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      jitterFactor: config.jitterFactor ?? 0.1,
      maxRetries: config.maxRetries ?? 5,
    };
    this.currentTimeoutMs = this.config.initialTimeoutMs;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (this.config.initialTimeoutMs <= 0) {
      throw new Error('initialTimeoutMs must be greater than 0');
    }
    if (this.config.maxTimeoutMs < this.config.initialTimeoutMs) {
      throw new Error('maxTimeoutMs must be >= initialTimeoutMs');
    }
    if (this.config.backoffMultiplier <= 1) {
      throw new Error('backoffMultiplier must be greater than 1');
    }
    if (this.config.jitterFactor < 0 || this.config.jitterFactor > 1) {
      throw new Error('jitterFactor must be between 0 and 1');
    }
    if (this.config.maxRetries < 1) {
      throw new Error('maxRetries must be at least 1');
    }
  }

  private calculateJitter(baseMs: number): number {
    const jitterRange = baseMs * this.config.jitterFactor;
    const randomJitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(1, baseMs + randomJitter);
  }

  private calculateBackoffTimeout(): number {
    const exponentialBackoff =
      this.config.initialTimeoutMs *
      Math.pow(this.config.backoffMultiplier, this.currentAttempt);
    const cappedBackoff = Math.min(exponentialBackoff, this.config.maxTimeoutMs);
    const withJitter = this.calculateJitter(cappedBackoff);
    return Math.round(withJitter);
  }

  private notifyObservers(
    method: keyof RoundTimerObserver,
    ...args: unknown[]
  ): void {
    for (const observer of this.observers) {
      try {
        (observer[method] as (...args: unknown[]) => void)(...args);
      } catch (error) {
        this.emit('observerError', {
          observer,
          method,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }
  }

  private clearTimeout(): void {
    if (this.timeoutHandle !== null) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }

  private handleTimeout = (): void => {
    this.currentAttempt++;
    this.notifyObservers('onRoundTimeout', this.currentRound, this.currentAttempt);
    this.emit('timeout', {
      round: this.currentRound,
      attempt: this.currentAttempt,
    });

    if (this.currentAttempt >= this.config.maxRetries) {
      this.isRunning = false;
      const error = new Error(
        `Round ${this.currentRound} exceeded max retries (${this.config.maxRetries})`
      );
      this.notifyObservers('onRoundError', this.currentRound, error);
      this.emit('maxRetriesExceeded', {
        round: this.currentRound,
        retries: this.currentAttempt,
      });
      return;
    }

    this.scheduleTimeout();
  };

  private scheduleTimeout(): void {
    this.clearTimeout();
    this.currentTimeoutMs = this.calculateBackoffTimeout();
    this.timeoutHandle = setTimeout(this.handleTimeout, this.currentTimeoutMs);
    this.emit('timeoutScheduled', {
      round: this.currentRound,
      attempt: this.currentAttempt,
      timeoutMs: this.currentTimeoutMs,
    });
  }

  public startRound(roundNumber: number): void {
    if (this.isRunning) {
      throw new Error(
        `Round ${this.currentRound} is already running. Call completeRound() first.`
      );
    }

    this.currentRound = roundNumber;
    this.currentAttempt = 0;
    this.roundStartTime = Date.now();
    this.currentTimeoutMs = this.config.initialTimeoutMs;
    this.isRunning = true;

    this.notifyObservers('onRoundStart', roundNumber);
    this.emit('roundStarted', { round: roundNumber });

    this.scheduleTimeout();
  }

  public completeRound(): void {
    if (!this.isRunning) {
      throw new Error('No round is currently running');
    }

    this.clearTimeout();
    const duration = Date.now() - this.roundStartTime;
    this.isRunning = false;

    this.notifyObservers('onRoundComplete', this.currentRound);
    this.emit('roundCompleted', {
      round: this.currentRound,
      attempts: this.currentAttempt,
      durationMs: duration,
    });
  }

  public resetBackoff(): void {
    this.currentTimeoutMs = this.config.initialTimeoutMs;
    this.currentAttempt = 0;
    if (this.isRunning) {
      this.scheduleTimeout();
    }
  }

  public addObserver(observer: RoundTimerObserver): void {
    if (!observer) {
      throw new Error('Observer cannot be null or undefined');
    }
    this.observers.add(observer);
    this.emit('observerAdded', { observer });
  }

  public removeObserver(observer: RoundTimerObserver): boolean {
    const wasRemoved = this.observers.delete(observer);
    if (wasRemoved) {
      this.emit('observerRemoved', { observer });
    }
    return wasRemoved;
  }

  public getObserverCount(): number {
    return this.observers.size;
  }

  public getCurrentRound(): number {
    return this.currentRound;
  }

  public getCurrentAttempt(): number {
    return this.currentAttempt;
  }

  public getCurrentTimeoutMs(): number {
    return this.currentTimeoutMs;
  }

  public isCurrentlyRunning(): boolean {
    return this.isRunning;
  }

  public getRoundElapsedMs(): number {
    if (!this.isRunning) {
      throw new Error('No round is currently running');
    }
    return Date.now() - this.roundStartTime;
  }

  public getConfig(): Readonly<RoundTimerConfig> {
    return Object.freeze({ ...this.config });
  }

  public destroy(): void {
    this.clearTimeout