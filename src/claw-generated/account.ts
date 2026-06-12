export class Account {
  public address: string;
  public nonce: number;
  public balance: number;

  constructor(address: string) {
    this.address = address;
    this.nonce = 0;
    this.balance = 0;
  }
}