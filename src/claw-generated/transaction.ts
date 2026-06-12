import { Account } from './account';

export class Transaction {
  public nonce: number;
  public from: Account;
  public to: Account;
  public value: number;
  public data: string;

  constructor(from: Account, to: Account, value: number, data: string) {
    this.from = from;
    this.to = to;
    this.value = value;
    this.data = data;
    this.nonce = from.nonce;
    from.nonce++;
  }

  validate(): boolean {
    // Check if the nonce is greater than the account's current nonce
    if (this.nonce <= this.from.nonce) {
      return false;
    }

    // Update the account's nonce
    this.from.nonce = this.nonce;

    return true;
  }
}