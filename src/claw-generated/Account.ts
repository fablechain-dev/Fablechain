export class Account {
  address: string;
  balance: number;
  nonce: number;

  constructor(address: string, balance: number, nonce: number) {
    this.address = address;
    this.balance = balance;
    this.nonce = nonce;
  }

  updateBalance(amount: number) {
    this.balance += amount;
  }

  incrementNonce() {
    this.nonce++;
  }
}