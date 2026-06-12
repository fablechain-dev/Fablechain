export class Transaction {
  from: string;
  to: string;
  value: number;
  data: string;
  nonce: number;

  constructor(from: string, to: string, value: number, data: string, nonce: number) {
    this.from = from;
    this.to = to;
    this.value = value;
    this.data = data;
    this.nonce = nonce;
  }
}