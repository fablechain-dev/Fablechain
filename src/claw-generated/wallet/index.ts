import { Ed25519SignatureProvider } from './signature-provider';
import { TransactionSerializer } from './transaction-serializer';

export class Wallet {
  private signatureProvider: Ed25519SignatureProvider;
  private transactionSerializer: TransactionSerializer;

  constructor() {
    this.signatureProvider = new Ed25519SignatureProvider();
    this.transactionSerializer = new TransactionSerializer();
  }

  async signTransaction(transaction: Transaction): Promise<SignedTransaction> {
    const serializedTx = this.transactionSerializer.serialize(transaction);
    const signature = await this.signatureProvider.sign(serializedTx);
    return { transaction, signature };
  }

  // Other wallet functionality like account management, balance queries, etc.
}

export interface Transaction {
  // Transaction data structure
}

export interface SignedTransaction {
  transaction: Transaction;
  signature: Signature;
}

export interface Signature {
  // Signature data structure
}