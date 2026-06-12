import { Account } from './Account';
import { Ed25519Signer } from './crypto/ed25519';

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
    this.signature = await Ed25519Signer.sign(this.getDataToSign(), this.sender.privateKey);
  }

  verify(): boolean {
    return Ed25519Signer.verify(this.getDataToSign(), this.signature, this.sender.publicKey);
  }

  private getDataToSign(): Uint8Array {
    return new Uint8Array([
      ...this.sender.publicKey,
      ...this.recipient.getBytes(),
      ...new Uint8Array(this.amount.toString().split('').map(Number)),
      ...new Uint8Array([Math.floor(this.timestamp / 1000)]),
    ]);
  }
}