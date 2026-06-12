export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, { value: V, time: number }>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | null {
    if (!this.cache.has(key)) {
      return null;
    }

    const entry = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, { value: entry.value, time: Date.now() });
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size === this.capacity) {
      const oldestKey = this.getOldestKey();
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, time: Date.now() });
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  private getOldestKey(): K {
    let oldestKey: K | undefined;
    let oldestTime = Number.MAX_SAFE_INTEGER;

    for (const [key, entry] of this.cache) {
      if (entry.time < oldestTime) {
        oldestKey = key;
        oldestTime = entry.time;
      }
    }

    return oldestKey!;
  }
}