import { Account } from './Account';

export class Transaction {
  sender: Account;
  recipient: string;
  amount: number;
  timestamp: number;
  signature: Uint8Array;

  constructor(sender: Account, recipient: string, amount: number) {
    this.sender = sender;
    this.recipient = recipient;
    this.amount = amount;
    this.timestamp = Date.now();
  }

  async sign(): Promise<void> {
    this.signature = await this.sender.sign(this.getDataToSign());
  }

  verify(): boolean {
    return this.sender.verify(this.getDataToSign(), this.signature);
  }

  private getDataToSign(): Uint8Array {
    // Implement logic to get the data that needs to be signed
    return new Uint8Array();
  }
}