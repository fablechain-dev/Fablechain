```typescript
import { EventEmitter } from 'events';

export interface EventMap {
  [key: string]: any[];
}

export type EventListener<T extends any[] = any[]> = (...args: T) => void | Promise<void>;

export interface EventSubscription {
  unsubscribe(): void;
}

export class EventBus<TEventMap extends EventMap = EventMap> {
  private emitter: EventEmitter;
  private listeners: Map<string, Set<EventListener>>;
  private onceListeners: Map<string, Set<EventListener>>;
  private maxListeners: number;

  constructor(maxListeners: number = 100) {
    this.emitter = new EventEmitter();
    this.listeners = new Map();
    this.onceListeners = new Map();
    this.maxListeners = maxListeners;
    this.emitter.setMaxListeners(maxListeners);
  }

  subscribe<K extends keyof TEventMap>(
    eventName: K,
    listener: EventListener<TEventMap[K]>
  ): EventSubscription {
    const eventKey = String(eventName);

    if (!this.listeners.has(eventKey)) {
      this.listeners.set(eventKey, new Set());
    }

    const listeners = this.listeners.get(eventKey)!;
    listeners.add(listener);

    this.emitter.on(eventKey, listener);

    return {
      unsubscribe: () => {
        this.unsubscribe(eventName, listener);
      },
    };
  }

  unsubscribe<K extends keyof TEventMap>(
    eventName: K,
    listener: EventListener<TEventMap[K]>
  ): boolean {
    const eventKey = String(eventName);
    const listeners = this.listeners.get(eventKey);

    if (!listeners) {
      return false;
    }

    const removed = listeners.delete(listener);
    if (removed) {
      this.emitter.removeListener(eventKey, listener);

      if (listeners.size === 0) {
        this.listeners.delete(eventKey);
      }
    }

    return removed;
  }

  once<K extends keyof TEventMap>(
    eventName: K,
    listener: EventListener<TEventMap[K]>
  ): EventSubscription {
    const eventKey = String(eventName);

    if (!this.onceListeners.has(eventKey)) {
      this.onceListeners.set(eventKey, new Set());
    }

    const onceListeners = this.onceListeners.get(eventKey)!;
    onceListeners.add(listener);

    const wrappedListener = async (...args: TEventMap[K]) => {
      try {
        await listener(...args);
      } finally {
        onceListeners.delete(listener);
        this.emitter.removeListener(eventKey, wrappedListener);
      }
    };

    this.emitter.once(eventKey, wrappedListener);

    return {
      unsubscribe: () => {
        onceListeners.delete(listener);
        this.emitter.removeListener(eventKey, wrappedListener);
      },
    };
  }

  async emit<K extends keyof TEventMap>(
    eventName: K,
    ...args: TEventMap[K]
  ): Promise<boolean> {
    const eventKey = String(eventName);
    const listeners = this.listeners.get(eventKey);
    const onceListeners = this.onceListeners.get(eventKey);

    if (!listeners && !onceListeners) {
      return false;
    }

    try {
      const promises: Promise<void>[] = [];

      if (listeners) {
        for (const listener of listeners) {
          const result = listener(...args);
          if (result instanceof Promise) {
            promises.push(result);
          }
        }
      }

      this.emitter.emit(eventKey, ...args);

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      return true;
    } catch (error) {
      throw new EventBusError(
        `Error emitting event ${String(eventName)}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  listenerCount<K extends keyof TEventMap>(eventName: K): number {
    const eventKey = String(eventName);
    const count = this.emitter.listenerCount(eventKey);
    return count;
  }

  removeAllListeners<K extends keyof TEventMap>(eventName?: K): void {
    if (eventName) {
      const eventKey = String(eventName);
      this.listeners.delete(eventKey);
      this.onceListeners.delete(eventKey);
      this.emitter.removeAllListeners(eventKey);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
      this.emitter.removeAllListeners();
    }
  }

  getEventNames(): (keyof TEventMap)[] {
    return this.emitter.eventNames() as (keyof TEventMap)[];
  }

  setMaxListeners(n: number): void {
    this.maxListeners = n;
    this.emitter.setMaxListeners(n);
  }

  getMaxListeners(): number {
    return this.maxListeners;
  }

  destroy(): void {
    this.removeAllListeners();
    this.emitter.removeAllListeners();
  }
}

export class EventBusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventBusError';
    Object.setPrototypeOf(this, EventBusError.prototype);
  }
}

export default EventBus;
```