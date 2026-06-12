class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, { value: V; prev: LRUNode<K, V> | null; next: LRUNode<K, V> | null }>;
  private head: LRUNode<K, V> | null;
  private tail: LRUNode<K, V> | null;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
    this.head = null;
    this.tail = null;
  }

  get(key: K): V | null {
    if (!this.map.has(key)) {
      return null;
    }

    const node = this.map.get(key)!;
    this.removeNode(node);
    this.addToHead(node);

    return node.value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.removeNode(this.map.get(key)!);
    }

    const node = { value, prev: null, next: null };
    this.addToHead(node);
    this.map.set(key, node);

    if (this.map.size > this.capacity) {
      const tail = this.removeTail();
      this.map.delete(tail.key);
    }
  }

  private removeNode(node: { value: V; prev: LRUNode<K, V> | null; next: LRUNode<K, V> | null }): void {
    const { prev, next } = node;

    if (prev) {
      prev.next = next;
    } else {
      this.head = next;
    }

    if (next) {
      next.prev = prev;
    } else {
      this.tail = prev;
    }
  }

  private addToHead(node: { value: V; prev: LRUNode<K, V> | null; next: LRUNode<K, V> | null }): void {
    node.prev = null;
    node.next = this.head;

    if (this.head) {
      this.head.prev = node;
    } else {
      this.tail = node;
    }

    this.head = node;
  }

  private removeTail(): LRUNode<K, V> {
    const tail = this.tail!;
    this.removeNode(tail);
    return tail;
  }
}

type LRUNode<K, V> = { value: V; prev: LRUNode<K, V> | null; next: LRUNode<K, V> | null; key?: K };

export { LRUCache };