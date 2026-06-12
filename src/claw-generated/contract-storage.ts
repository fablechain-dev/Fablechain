import { StorageSlot } from '../accounts/storage-slot';

export class ContractStorage {
  private slots: Map<string, StorageSlot> = new Map();
  private mappings: Map<string, Map<string, StorageSlot>> = new Map();
  private arrays: Map<string, StorageSlot[]> = new Map();

  get(key: string): StorageSlot {
    if (!this.slots.has(key)) {
      this.slots.set(key, new StorageSlot());
    }
    return this.slots.get(key)!;
  }

  set(key: string, value: StorageSlot): void {
    this.slots.set(key, value);
  }

  delete(key: string): void {
    this.slots.delete(key);
    this.mappings.delete(key);
    this.arrays.delete(key);
  }

  has(key: string): boolean {
    return this.slots.has(key) || this.mappings.has(key) || this.arrays.has(key);
  }

  getKeys(): string[] {
    return Array.from(this.slots.keys())
      .concat(Array.from(this.mappings.keys()))
      .concat(Array.from(this.arrays.keys()));
  }

  getMapping(key: string): Map<string, StorageSlot> {
    if (!this.mappings.has(key)) {
      this.mappings.set(key, new Map());
    }
    return this.mappings.get(key)!;
  }

  setMapping(key: string, mapping: Map<string, StorageSlot>): void {
    this.mappings.set(key, mapping);
  }

  getArray(key: string): StorageSlot[] {
    if (!this.arrays.has(key)) {
      this.arrays.set(key, []);
    }
    return this.arrays.get(key)!;
  }

  setArray(key: string, array: StorageSlot[]): void {
    this.arrays.set(key, array);
  }
}