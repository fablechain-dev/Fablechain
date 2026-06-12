import { Event } from './event';
import { hash } from './utils';

export class BloomFilter {
  private bits: Uint8Array;
  private capacity: number = 1000;
  private hashFunctions: number = 3;

  constructor() {
    this.bits = new Uint8Array(Math.ceil(this.capacity / 8));
  }

  add(event: Event): void {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this.hash(event, i) % this.bits.length;
      this.bits[index] = 1;
    }
  }

  mayContain(event: Event): boolean {
    for (let i = 0; i < this.hashFunctions; i++) {
      const index = this.hash(event, i) % this.bits.length;
      if (this.bits[index] === 0) {
        return false;
      }
    }
    return true;
  }

  private hash(event: Event, seed: number): number {
    return hash(`${event.contractAddress}:${event.name}:${seed}`);
  }
}