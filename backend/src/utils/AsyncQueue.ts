```typescript
import { EventEmitter } from 'events';

export interface AsyncQueueOptions {
  maxSize: number;
  timeout?: number;
}

export interface QueueItem<T> {
  data: T;
  resolve: (value: void) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export class AsyncQueue<T> extends EventEmitter {
  private queue: T[] = [];
  private waitingConsumers: Array<{
    resolve: (value: T) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private waitingProducers: Array<{
    resolve: (value: void) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private closed: boolean = false;
  private draining: boolean = false;
  private readonly maxSize: number;
  private readonly timeout: number;
  private enqueueCount: number = 0;
  private dequeueCount: number = 0;

  constructor(options: AsyncQueueOptions) {
    super();
    if (options.maxSize <= 0) {
      throw new Error('maxSize must be greater than 0');
    }
    this.maxSize = options.maxSize;
    this.timeout = options.timeout || 30000;
    this.setMaxListeners(100);
  }

  async enqueue(item: T): Promise<void> {
    if (this.closed) {
      throw new Error('Queue is closed');
    }

    if (this.queue.length >= this.maxSize) {
      await this.waitForCapacity();
    }

    if (this.closed) {
      throw new Error('Queue was closed while waiting for capacity');
    }

    this.queue.push(item);
    this.enqueueCount++;
    this.emit('enqueued', item);

    const consumer = this.waitingConsumers.shift();
    if (consumer) {
      clearTimeout(consumer.timeout);
      consumer.resolve(this.queue.shift()!);
      this.dequeueCount++;

      const producer = this.waitingProducers.shift();
      if (producer) {
        clearTimeout(producer.timeout);
        producer.resolve();
      }
    }
  }

  async dequeue(): Promise<T> {
    if (this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.dequeueCount++;
      this.emit('dequeued', item);

      const producer = this.waitingProducers.shift();
      if (producer) {
        clearTimeout(producer.timeout);
        producer.resolve();
      }

      return item;
    }

    if (this.closed && this.queue.length === 0) {
      throw new Error('Queue is closed and empty');
    }

    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingConsumers.indexOf(consumerEntry);
        if (index !== -1) {
          this.waitingConsumers.splice(index, 1);
        }
        reject(new Error(`Dequeue timeout after ${this.timeout}ms`));
      }, this.timeout);

      const consumerEntry = { resolve, reject, timeout };
      this.waitingConsumers.push(consumerEntry);
    });
  }

  async drain(): Promise<void> {
    if (this.draining) {
      throw new Error('Drain already in progress');
    }

    this.draining = true;

    try {
      while (this.queue.length > 0) {
        await new Promise<void>((resolve) => {
          const checkInterval = setInterval(() => {
            if (this.queue.length === 0) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 10);

          setTimeout(() => {
            clearInterval(checkInterval);
            resolve();
          }, this.timeout);
        });
      }

      this.emit('drained');
    } finally {
      this.draining = false;
    }
  }

  async close(): Promise<void> {
    this.closed = true;

    const rejectError = new Error('Queue was closed');

    for (const consumer of this.waitingConsumers) {
      clearTimeout(consumer.timeout);
      consumer.reject(rejectError);
    }
    this.waitingConsumers = [];

    for (const producer of this.waitingProducers) {
      clearTimeout(producer.timeout);
      producer.reject(rejectError);
    }
    this.waitingProducers = [];

    await this.drain();
    this.emit('closed');
    this.removeAllListeners();
  }

  private async waitForCapacity(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingProducers.indexOf(producerEntry);
        if (index !== -1) {
          this.waitingProducers.splice(index, 1);
        }
        reject(new Error(`Enqueue backpressure timeout after ${this.timeout}ms`));
      }, this.timeout);

      const producerEntry = { resolve, reject, timeout };
      this.waitingProducers.push(producerEntry);
    });
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  isFull(): boolean {
    return this.queue.length >= this.maxSize;
  }

  isOpen(): boolean {
    return !this.closed;
  }

  stats(): {
    size: number;
    maxSize: number;
    enqueued: number;
    dequeued: number;
    pending: number;
    closed: boolean;
  } {
    return {
      size: this.queue.length,
      maxSize: this.maxSize,
      enqueued: this.enqueueCount,
      dequeued: this.dequeueCount,
      pending: this.enqueueCount - this.dequeueCount,
      closed: this.closed,
    };
  }

  clear(): void {
    if (this.closed) {
      throw new Error('Cannot clear a closed queue');
    }
    this.queue = [];
    this.emit('cleared');
  }
}
```