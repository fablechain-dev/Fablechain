export class Transaction {
  public from: string;
  public to: string;
  public value: number;
  public data: string;
  public nonce: number;

  constructor(from: string, to: string, value: number, data: string, nonce: number) {
    this.from = from;
    this.to = string;
    this.value = value;
    this.data = data;
    this.nonce = nonce;
  }

  execute(accounts: Map<string, Account>): void {
    const fromAccount = accounts.get(this.from);
    const toAccount = accounts.get(this.to);

    if (!fromAccount || !toAccount) {
      throw new Error('Invalid account');
    }

    if (fromAccount.nonce !== this.nonce) {
      throw new Error('Invalid nonce');
    }

    if (fromAccount.balance < this.value) {
      throw new Error('Insufficient funds');
    }

    fromAccount.balance -= this.value;
    toAccount.balance += this.value;
    fromAccount.nonce++;

    // Handle storage slot updates
    if (this.data.startsWith('0x')) {
      const slotKey = this.data.slice(2, 66);
      const slotValue = this.data.slice(66);
      fromAccount.setStorageSlot(slotKey, slotValue);
    }
  }
}