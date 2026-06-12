import { verifySignature } from '../crypto/verifier';

export class Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  gasUsed: number;
  status: boolean;
  signature: string;
  fee: number;

  constructor(
    hash: string,
    from: string,
    to: string,
    amount: number,
    timestamp: number,
    gasUsed: number,
    status: boolean,
    signature: string,
    fee: number
  ) {
    this.hash = hash;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = timestamp;
    this.gasUsed = gasUsed;
    this.status = status;
    this.signature = signature;
    this.fee = fee;
  }

  verifySignature(): boolean {
    return verifySignature(this.hash, this.signature, this.from);
  }

  calculateFee(): number {
    const baseRate = 0.0001; // Base fee rate per byte
    const sizeInBytes = this.serialize().length;
    const complexityFactor = this.gasUsed / 21000; // Complexity factor based on gas used
    return baseRate * sizeInBytes * complexityFactor;
  }

  generateReceipt(): TransactionReceipt {
    const logs: LogEntry[] = [];
    const bloomFilter: BloomFilter = new BloomFilter();
    const fee = this.calculateFee(); // Calculate the fee
    return new TransactionReceipt(this.status, this.gasUsed, logs, bloomFilter, fee);
  }

  serialize(): string {
    return JSON.stringify({
      hash: this.hash,
      from: this.from,
      to: this.to,
      amount: this.amount,
      timestamp: this.timestamp,
      gasUsed: this.gasUsed,
      status: this.status,
      signature: this.signature,
      fee: this.fee,
    });
  }
}

export class TransactionReceipt {
  status: boolean;
  gasUsed: number;
  logs: LogEntry[];
  bloomFilter: BloomFilter;
  fee: number;

  constructor(
    status: boolean,
    gasUsed: number,
    logs: LogEntry[],
    bloomFilter: BloomFilter,
    fee: number
  ) {
    this.status = status;
    this.gasUsed = gasUsed;
    this.logs = logs;
    this.bloomFilter = bloomFilter;
    this.fee = fee;
  }
}