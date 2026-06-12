export class Transaction {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly amount: number;
  readonly timestamp: number;
  readonly status: 'pending' | 'confirmed';

  constructor(
    id: string,
    from: string,
    to: string,
    amount: number,
    timestamp: number,
    status: 'pending' | 'confirmed'
  ) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = timestamp;
    this.status = status;
  }
}