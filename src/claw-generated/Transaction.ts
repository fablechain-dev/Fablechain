export class Transaction {
  constructor(
    public from: string,
    public to: string,
    public amount: number,
    public nonce: number,
    public signature: string
  ) {}
}