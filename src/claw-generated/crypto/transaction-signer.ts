import { KeyPair } from '../wallet/keypair';
import { generateKeypair, verifySignature as verifyEd25519Signature } from './ed25519';

export class TransactionSigner {
  static signTransaction(transaction: any, keyPair: KeyPair): any {
    const { privateKey } = keyPair;
    const transactionData = this.serializeTransaction(transaction);
    const signature = this.signData(transactionData, privateKey);
    return { ...transaction, signature };
  }

  static verifySignature(transaction: any): boolean {
    const { signature, ...transactionData } = transaction;
    const { publicKey } = this.getKeyPair(transaction.from);
    return verifyEd25519Signature(publicKey, signature, this.serializeTransaction(transactionData));
  }

  private static serializeTransaction(transaction: any): string {
    // Implement transaction serialization logic
    return JSON.stringify(transaction);
  }

  private static signData(data: string, privateKey: string): string {
    // Sign the serialized transaction data using the private key
    const { signature } = this.getKeyPair(privateKey);
    return signature;
  }

  private static getKeyPair(publicKey: string): KeyPair {
    return { publicKey, privateKey: '' };
  }
}