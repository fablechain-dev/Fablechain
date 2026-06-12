import { Ed25519KeyPair } from './Ed25519KeyPair';

export class Transaction {
  public readonly id: string;
  public readonly from: Ed25519KeyPair;
  public readonly to: Ed25519KeyPair;
  public readonly amount: number;
  public readonly timestamp: number;
  public readonly signature: string;

  constructor(from: Ed25519KeyPair, to: Ed25519KeyPair, amount: number) {
    this.from = from;
    this.to = to;
    this.amount = amount;
    this.timestamp = Date.now();
    this.id = this.generateTransactionId();
    this.signature = this.sign();
  }

  private generateTransactionId(): string {
    // Generate a unique transaction ID based on the transaction details
    return `${this.from.publicKey}-${this.to.publicKey}-${this.amount}-${this.timestamp}`;
  }

  private sign(): string {
    // Sign the transaction with the sender's private key
    return this.from.sign(this.id);
  }

  public serialize(): string {
    // Serialize the transaction object to a string
    return JSON.stringify({
      id: this.id,
      from: this.from.publicKey,
      to: this.to.publicKey,
      amount: this.amount,
      timestamp: this.timestamp,
      signature: this.signature
    });
  }

  public static deserialize(transactionString: string): Transaction {
    // Deserialize a transaction string back into a Transaction object
    const transactionData = JSON.parse(transactionString);
    const from = new Ed25519KeyPair(transactionData.from);
    const to = new Ed25519KeyPair(transactionData.to);
    const transaction = new Transaction(from, to, transactionData.amount);
    transaction.signature = transactionData.signature;
    return transaction;
  }
}