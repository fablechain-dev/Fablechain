import { StorageSlot } from './StorageSlot';

export class Contract {
  private storageSlots: StorageSlot[] = [];

  getStorageSlot(key: string): StorageSlot | undefined {
    return this.storageSlots.find(slot => slot.key === key);
  }

  setStorageSlot(key: string, value: any): void {
    const existingSlot = this.getStorageSlot(key);
    if (existingSlot) {
      existingSlot.value = value;
    } else {
      this.storageSlots.push(new StorageSlot(key, value));
    }
  }

  deleteStorageSlot(key: string): void {
    this.storageSlots = this.storageSlots.filter(slot => slot.key !== key);
  }

  getStorageSlots(): StorageSlot[] {
    return this.storageSlots;
  }
}