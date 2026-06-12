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

  // New CRUD operations

  read(key: string): StorageSlot {
    return this.get(key);
  }

  write(key: string, value: StorageSlot): void {
    this.set(key, value);
  }

  update(key: string, value: StorageSlot): void {
    this.set(key, value);
  }

  remove(key: string): void {
    this.delete(key);
  }

  readMapping(key: string, mapKey: string): StorageSlot {
    const mapping = this.getMapping(key);
    return mapping.get(mapKey) || new StorageSlot();
  }

  writeMapping(key: string, mapKey: string, value: StorageSlot): void {
    const mapping = this.getMapping(key);
    mapping.set(mapKey, value);
    this.setMapping(key, mapping);
  }

  updateMapping(key: string, mapKey: string, value: StorageSlot): void {
    this.writeMapping(key, mapKey, value);
  }

  removeMapping(key: string, mapKey: string): void {
    const mapping = this.getMapping(key);
    mapping.delete(mapKey);
    this.setMapping(key, mapping);
  }

  readArray(key: string, index: number): StorageSlot {
    const array = this.getArray(key);
    return array[index] || new StorageSlot();
  }

  writeArray(key: string, index: number, value: StorageSlot): void {
    const array = this.getArray(key);
    array[index] = value;
    this.setArray(key, array);
  }

  updateArray(key: string, index: number, value: StorageSlot): void {
    this.writeArray(key, index, value);
  }

  removeArray(key: string, index: number): void {
    const array = this.getArray(key);
    array.splice(index, 1);
    this.setArray(key, array);
  }
}