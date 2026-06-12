import { verifySignature } from '../crypto/verifier';

export class Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  gasUsed: number;
  status: boolean;
  signature: string; // New signature property

  constructor(
    hash: string,
    from: string,
    to: string,
    amount: number,
    timestamp: number,
    gasUsed: number,
    status: boolean,
    signature: string // New signature parameter
  ) {
    this.hash = hash;
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = timestamp;
    this.gasUsed = gasUsed;
    this.status = status;
    this.signature = signature; // Assign signature to the new property
  }

  verifySignature(): boolean {
    // Verify the transaction's signature using the sender's public key
    return verifySignature(this.hash, this.signature, this.from);
  }

  generateReceipt(): TransactionReceipt {
    // Generate transaction receipt data
    const logs: LogEntry[] = []; // Replace with actual logs
    const bloomFilter: BloomFilter = new BloomFilter(); // Replace with actual bloom filter

    return new TransactionReceipt(this.status, this.gasUsed, logs, bloomFilter);
  }
}