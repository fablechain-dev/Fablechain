import { StorageMap, StorageArray } from './Storage';

class Contract {
  private storage: Map<string, StorageMap | StorageArray> = new Map();

  get(key: string): StorageMap | StorageArray | undefined {
    return this.storage.get(key);
  }

  set(key: string, value: StorageMap | StorageArray): void {
    this.storage.set(key, value);
  }

  delete(key: string): void {
    this.storage.delete(key);
  }
}

export { Contract };