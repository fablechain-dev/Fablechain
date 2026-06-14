```typescript
import { EventEmitter } from 'events';

export interface RoundTimerConfig {
  initialTimeoutMs: number;
  maxTimeoutMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
  maxRetries?: number;
}

export interface RoundTimerObserver {
  onRoundStart(roundNumber: number): void;
  onRoundTimeout(roundNumber: number, attempt: number): void;
  onRoundComplete(roundNumber: number, durationMs: number): void;
  onRoundError(roundNumber: number, error: Error): void;
}

export interface RoundTimerState {
  roundNumber: number;
  currentTimeoutMs: number;
  attempt: number;
  isActive: boolean;
  startTimestamp: number | null;
  lastTimeoutTimestamp: number | null;
}

export class RoundTimer extends EventEmitter {
  private config: RoundTimerConfig;
  private state: RoundTimerState;
  private observers: Set<RoundTimerObserver>;
  private timeoutHandle: NodeJS.Timeout | null = null;
  private roundStartTime: number | null = null;

  constructor(config: RoundTimerConfig) {
    super();
    
    this.config = {
      initialTimeoutMs: config.initialTimeoutMs,
      maxTimeoutMs: config.maxTimeoutMs,
      backoffMultiplier: config.backoffMultiplier,
      jitterFactor: config.jitterFactor,
      maxRetries: config.maxRetries ?? 5,
    };

    this.observers = new Set();
    this.state = {
      roundNumber: 0,
      currentTimeoutMs: this.config.initialTimeoutMs,
      attempt: 0,
      isActive: false,
      startTimestamp: null,
      lastTimeoutTimestamp: null,
    };

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
  }

  public subscribe(observer: RoundTimerObserver): void {
    this.observers.add(observer);
  }

  public unsubscribe(observer: RoundTimerObserver): void {
    this.observers.delete(observer);
  }

  public startRound(roundNumber: number): void {
    if (this.state.isActive) {
      this.notifyObserversError(
        new Error(`Cannot start round ${roundNumber}: round ${this.state.roundNumber} is already active`)
      );
      return;
    }

    this.state.roundNumber = roundNumber;
    this.state.attempt = 0;
    this.state.isActive = true;
    this.state.startTimestamp = Date.now();
    this.roundStartTime = Date.now();
    this.state.currentTimeoutMs = this.config.initialTimeoutMs;

    this.notifyObserversRoundStart(roundNumber);
    this.scheduleTimeout();
  }

  public completeRound(): void {
    if (!this.state.isActive) {
      return;
    }

    const durationMs = this.roundStartTime ? Date.now() - this.roundStartTime : 0;
    this.notifyObserversRoundComplete(this.state.roundNumber, durationMs);
    this.resetRound();
  }

  public extendRound(additionalTimeMs: number): void {
    if (!this.state.isActive) {
      return;
    }

    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }

    this.state.currentTimeoutMs = Math.min(
      this.state.currentTimeoutMs + additionalTimeMs,
      this.config.maxTimeoutMs
    );

    this.scheduleTimeout();
  }

  public resetRound(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }

    this.state.isActive = false;
    this.state.attempt = 0;
    this.state.currentTimeoutMs = this.config.initialTimeoutMs;
    this.state.startTimestamp = null;
    this.roundStartTime = null;
  }

  public getCurrentState(): Readonly<RoundTimerState> {
    return Object.freeze({ ...this.state });
  }

  public getConfig(): Readonly<RoundTimerConfig> {
    return Object.freeze({ ...this.config });
  }

  public isRoundActive(): boolean {
    return this.state.isActive;
  }

  public getCurrentRoundNumber(): number {
    return this.state.roundNumber;
  }

  public getCurrentAttempt(): number {
    return this.state.attempt;
  }

  public getCurrentTimeoutMs(): number {
    return this.state.currentTimeoutMs;
  }

  private scheduleTimeout(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }

    const timeoutWithJitter = this.applyJitter(this.state.currentTimeoutMs);

    this.timeoutHandle = setTimeout(() => {
      this.handleTimeout();
    }, timeoutWithJitter);
  }

  private handleTimeout(): void {
    if (!this.state.isActive) {
      return;
    }

    this.state.attempt++;
    this.state.lastTimeoutTimestamp = Date.now();

    this.notifyObserversRoundTimeout(this.state.roundNumber, this.state.attempt);

    const shouldRetry = 
      this.config.maxRetries === undefined || 
      this.state.attempt < this.config.maxRetries;

    if (shouldRetry) {
      this.increaseTimeoutExponentially();
      this.scheduleTimeout();
    } else {
      const error = new Error(
        `Round ${this.state.roundNumber} timeout after ${this.state.attempt} attempts`
      );
      this.notifyObserversError(error);
      this.resetRound();
    }
  }

  private increaseTimeoutExponentially(): void {
    const nextTimeout = this.state.currentTimeoutMs * this.config.backoffMultiplier;
    this.state.currentTimeoutMs = Math.min(nextTimeout, this.config.maxTimeoutMs);
  }

  private applyJitter(timeoutMs: number): number {
    const jitterRange = timeoutMs * this.config.jitterFactor;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(1, timeoutMs + jitter);
  }

  private notifyObserversRoundStart(roundNumber: number): void {
    this.observers.forEach(observer => {
      try {
        observer.onRoundStart(roundNumber);
      } catch (error) {
        this.emit('observerError', error, 'onRoundStart');
      }
    });
  }

  private notifyObserversRoundTimeout(roundNumber: number, attempt: number): void {
    this.observers.forEach(observer => {
      try {
        observer.onRoundTimeout(roundNumber, attempt);
      } catch (error) {
        this.emit('observerError', error, 'onRoundTimeout');
      }
    });
  }

  private notifyObserversRoundComplete(roundNumber: number, durationMs: number): void {
    this.observers.forEach(observer => {
      try {
        observer.onRoundComplete(roundNumber, durationMs