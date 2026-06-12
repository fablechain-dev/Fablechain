import { StorageSlot } from './StorageSlot';
import { StorageArray } from './StorageArray';

export class Contract {
  private storageSlots: Map<string, StorageSlot | StorageArray> = new Map();

  constructor() {
    // Initialize contract state
  }

  // CRUD operations for storage slots
  getStorageSlot(key: string): StorageSlot {
    const slot = this.storageSlots.get(key);
    if (slot instanceof StorageSlot) {
      return slot;
    } else {
      const newSlot = new StorageSlot();
      this.storageSlots.set(key, newSlot);
      return newSlot;
    }
  }

  getStorageArray(key: string): StorageArray {
    const slot = this.storageSlots.get(key);
    if (slot instanceof StorageArray) {
      return slot;
    } else {
      const newArray = new StorageArray();
      this.storageSlots.set(key, newArray);
      return newArray;
    }
  }

  setStorageSlot(key: string, slot: StorageSlot): void {
    this.storageSlots.set(key, slot);
  }

  setStorageArray(key: string, array: StorageArray): void {
    this.storageSlots.set(key, array);
  }

  deleteStorageSlot(key: string): void {
    this.storageSlots.delete(key);
  }
}