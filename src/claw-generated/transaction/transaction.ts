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
  fee: number; // New fee property

  constructor(
    hash: string,
    from: string,
    to: string,
    amount: number,
    timestamp: number,
    gasUsed: number,
    status: boolean,
    signature: string,
    fee: number // New fee parameter
  ) {
    this.hash = hash;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = timestamp;
    this.gasUsed = gasUsed;
    this.status = status;
    this.signature = signature;
    this.fee = fee; // Assign fee to the new property
  }

  verifySignature(): boolean {
    // Verify the transaction's signature using the sender's public key
    return verifySignature(this.hash, this.signature, this.from);
  }

  calculateFee(): number {
    // Calculate the transaction fee based on size and complexity
    const baseRate = 0.0001; // Base fee rate per byte
    const sizeInBytes = this.serialize().length;
    const complexityFactor = this.gasUsed / 21000; // Complexity factor based on gas used
    return baseRate * sizeInBytes * complexityFactor;
  }

  generateReceipt(): TransactionReceipt {
    // Generate transaction receipt data
    const logs: LogEntry[] = []; // Replace with actual logs
    const bloomFilter: BloomFilter = new BloomFilter(); // Replace with actual bloom filter

    return new TransactionReceipt(this.status, this.gasUsed, logs, bloomFilter, this.fee); // Include the fee in the receipt
  }

  serialize(): string {
    // Serialize the transaction data into a string
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
  fee: number; // New fee property

  constructor(
    status: boolean,
    gasUsed: number,
    logs: LogEntry[],
    bloomFilter: BloomFilter,
    fee: number // New fee parameter
  ) {
    this.status = status;
    this.gasUsed = gasUsed;
    this.logs = logs;
    this.bloomFilter = bloomFilter;
    this.fee = fee; // Assign fee to the new property
  }
}