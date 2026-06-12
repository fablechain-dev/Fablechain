export class Account {
  public address: string;
  public balance: number;
  public nonce: number;
  public storageSlots: Map<string, any>;

  constructor(address: string, balance: number, nonce: number) {
    this.address = address;
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