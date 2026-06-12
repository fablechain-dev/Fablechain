import { TransactionSigner } from '../crypto/transaction-signer';
import { KeyPair } from '../wallet/keypair';

export class Transaction {
  public signature: string;

  constructor(public from: string, public to: string, public amount: number, public data: string) {}

  sign(keyPair: KeyPair): Transaction {
    const signedTransaction = TransactionSigner.signTransaction(this, keyPair);
    this.signature = signedTransaction.signature;
    return this;
  }

  verify(): boolean {
    return TransactionSigner.verifySignature(this);
  }

  serialize(): string {
    return JSON.stringify({
      from: this.from,
      to: this.to,
      amount: this.amount,
      data: this.data,
      signature: this.signature,
    });
  }

  static deserialize(serializedTransaction: string): Transaction {
    const { from, to, amount, data, signature } = JSON.parse(serializedTransaction);
    const transaction = new Transaction(from, to, amount, data);
    transaction.signature = signature;
    return transaction;
  }

  broadcast(): void {
    // Implement transaction broadcasting logic
  }
}