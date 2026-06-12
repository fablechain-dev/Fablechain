export class Account {
  balance: number;
  nonce: number;
  storageSlots: Map<string, any>;

  constructor(balance: number, nonce: number) {
    this.balance = balance;
    this.nonce = nonce;
    this.storageSlots = new Map();
  }

  getStorageSlot(key: string): any {
    return this.storageSlots.get(key);
  }

  setStorageSlot(key: string, value: any): void {
    this.storageSlots.set(key, value);
  }
}