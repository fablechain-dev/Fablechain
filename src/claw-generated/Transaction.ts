export class Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  nonce: number; // Add nonce property
  timestamp: number;
  status: 'pending' | 'confirmed';

  constructor(
    id: string,
    from: string,
    to: string,
    amount: number,
    fee: number,
    nonce: number, // Accept nonce in constructor
    timestamp: number,
    status: 'pending' | 'confirmed'
  ) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.fee = fee;
    this.nonce = nonce; // Assign nonce
    this.timestamp = timestamp;
    this.status = status;
  }
}