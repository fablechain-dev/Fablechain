```typescript
import { EventEmitter } from 'events';

export interface LRUCacheOptions {
  maxSize: number;
  ttlMs?: number;
  onEvict?: (key: string, value: unknown) => void;
}

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
  accessCount: number;
  lastAccessTime: number;
}

interface Node<T> {
  key: string;
  entry: CacheEntry<T>;
  prev?: Node<T>;
  next?: Node<T>;
}

export class LRUCache<T = unknown> extends EventEmitter {
  private readonly maxSize: number;
  private readonly ttlMs?: number;
  private readonly onEvict?: (key: string, value: T) => void;
  private readonly cache: Map<string, Node<T>>;
  private head?: Node<T>;
  private tail?: Node<T>;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: LRUCacheOptions) {
    super();
    
    if (options.maxSize <= 0) {
      throw new Error('maxSize must be greater than 0');
    }

    this.maxSize = options.maxSize;
    this.ttlMs = options.ttlMs;
    this.onEvict = options.onEvict;
    this.cache = new Map();

    if (this.ttlMs) {
      this.startCleanupInterval();
    }
  }

  private startCleanupInterval(): void {
    const cleanupFrequency = Math.max(100, (this.ttlMs || 60000) / 10);
    this.cleanupInterval = setInterval(() => {
      this.evictExpiredEntries();
    }, cleanupFrequency);
    this.cleanupInterval.unref();
  }

  private evictExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, node] of this.cache.entries()) {
      if (node.entry.expiresAt && node.entry.expiresAt <= now) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.expiresAt) {
      return false;
    }
    return Date.now() > entry.expiresAt;
  }

  private moveToFront(node: Node<T>): void {
    if (node === this.head) {
      return;
    }

    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
    if (node === this.tail) {
      this.tail = node.prev;
    }

    node.prev = undefined;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    }
    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: Node<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    }
    if (node.next) {
      node.next.prev = node.prev;
    }
    if (node === this.head) {
      this.head = node.next;
    }
    if (node === this.tail) {
      this.tail = node.prev;
    }
  }

  private evictLRU(): void {
    if (!this.tail) {
      return;
    }

    const key = this.tail.key;
    const value = this.tail.entry.value;

    this.removeNode(this.tail);
    this.cache.delete(key);

    if (this.onEvict) {
      try {
        this.onEvict(key, value);
      } catch (error) {
        this.emit('error', new Error(`Error in onEvict callback: ${error}`));
      }
    }

    this.emit('evict', { key, value });
  }

  set(key: string, value: T): void {
    if (!key) {
      throw new Error('Cache key cannot be empty');
    }

    let node = this.cache.get(key);

    if (node) {
      node.entry.value = value;
      node.entry.lastAccessTime = Date.now();
      node.entry.accessCount++;
      if (this.ttlMs) {
        node.entry.expiresAt = Date.now() + this.ttlMs;
      }
      this.moveToFront(node);
      this.emit('update', { key, value });
      return;
    }

    const newEntry: CacheEntry<T> = {
      value,
      accessCount: 1,
      lastAccessTime: Date.now(),
    };

    if (this.ttlMs) {
      newEntry.expiresAt = Date.now() + this.ttlMs;
    }

    const newNode: Node<T> = {
      key,
      entry: newEntry,
    };

    this.cache.set(key, newNode);
    this.moveToFront(newNode);

    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }

    this.emit('set', { key, value });
  }

  get(key: string): T | undefined {
    const node = this.cache.get(key);

    if (!node) {
      this.emit('miss', { key });
      return undefined;
    }

    if (this.isExpired(node.entry)) {
      this.delete(key);
      this.emit('miss', { key });
      return undefined;
    }

    node.entry.lastAccessTime = Date.now();
    node.entry.accessCount++;
    this.moveToFront(node);

    this.emit('hit', { key, value: node.entry.value });
    return node.entry.value;
  }

  has(key: string): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    if (this.isExpired(node.entry)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const node = this.cache.get(key);

    if (!node) {
      return false;
    }

    const value = node.entry.value;
    this.removeNode(node);
    this.cache.delete(key);

    if (this.onEvict) {
      try {
        this.onEvict(key, value);
      } catch (error) {
        this.emit('error', new Error(`Error in onEvict callback: ${error}`));
      }
    }

    this.emit('delete', { key, value });
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = undefined;
    this.tail = undefined;
    this.emit('clear');
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): T[] {
    return Array.from(this.cache.values()).map(node => node.entry.value);
  }

  entries(): Array<[string, T]> {
    return Array.from(this.cache.entries()).map(([key, node]) => [
      key,
      node.entry.value,
    ]);
  }

  getStats(key: string): { accessCount: number; lastAccessTime: number; expiresAt?: number } | null {
    const node = this.cache.get(key);

    if (!node) {
      return null;
    }

    return {
      accessCount: node.entry.accessCount,
      lastAccessTime: node.entry.lastAccess