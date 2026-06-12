export class Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  nonce: number;
  timestamp: number;
  status: 'pending' | 'confirmed';

  constructor(
    id: string,
    from: string,
    to: string,
    amount: number,
    fee: number,
    nonce: number,
    timestamp: number,
    status: 'pending' | 'confirmed'
  ) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.fee = fee;
    this.nonce = nonce;
    this.timestamp = timestamp;
    this.status = status;
  }

  static getTransactionHistory(address: string, transactions: Transaction[]): Transaction[] {
    return transactions.filter(tx => tx.from === address || tx.to === address);
  }
}