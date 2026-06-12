export class StorageSlot {
  private value: any;

  get(): any {
    return this.value;
  }

  set(newValue: any): void {
    this.value = newValue;
  }
}