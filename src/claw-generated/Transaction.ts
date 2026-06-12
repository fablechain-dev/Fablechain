export class Transaction {
  to: string | null;
  value: number;
  data: string;
  nonce: number;

  constructor(params: { to: string | null; value: number; data: string; nonce: number }) {
    this.to = params.to;
    this.value = params.value;
    this.data = params.data;
    this.nonce = params.nonce;
  }
}