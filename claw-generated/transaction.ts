import { Ed25519Signer } from './signer';

export class Transaction {
  private signature: string;

  constructor(
    public from: string,
    public to: string,
    public amount: number,
    public nonce: number
  ) {}

  serialize(): string {
    return `${this.from}:${this.to}:${this.amount}:${this.nonce}:${this.signature}`;
  }

  sign(privateKey: string): void {
    const signer = new Ed25519Signer(privateKey);
    this.signature = signer.sign(this.serialize());
  }

  broadcast(): void {
    // Broadcast the signed transaction to the network
    console.log(`Broadcasting transaction: ${this.serialize()}`);
  }
}