import { StorageSlot } from './StorageSlot';

export class StorageArray {
  private elements: StorageSlot[] = [];

  get(index: number): StorageSlot {
    return this.elements[index] || new StorageSlot();
  }

  set(index: number, value: any): void {
    if (index >= this.elements.length) {
      this.elements = this.elements.concat(
        Array(index - this.elements.length + 1).fill(new StorageSlot())
      );
    }
    this.elements[index].set(value);
  }

  push(value: any): number {
    this.elements.push(new StorageSlot().set(value));
    return this.elements.length - 1;
  }

  length(): number {
    return this.elements.length;
  }
}