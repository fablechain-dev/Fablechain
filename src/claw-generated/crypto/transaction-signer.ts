import { KeyPair } from '../wallet/keypair';
import { generateKeypair, verifySignature as verifyEd25519Signature } from './ed25519';
import { signECDSA, verifyECDSASignature } from './ecdsa';

export class TransactionSigner {
  static signTransaction(transaction: any, keyPair: KeyPair, signatureScheme: 'ed25519' | 'ecdsa'): any {
    const { privateKey } = keyPair;
    const transactionData = this.serializeTransaction(transaction);

    let signature;
    if (signatureScheme === 'ed25519') {
      signature = this.signEd25519(transactionData, privateKey);
    } else if (signatureScheme === 'ecdsa') {
      signature = this.signECDSA(transactionData, privateKey);
    } else {
      throw new Error('Unsupported signature scheme');
    }

    return { ...transaction, signature, signatureScheme };
  }

  static verifySignature(transaction: any): boolean {
    const { signature, signatureScheme, ...transactionData } = transaction;
    const { publicKey } = this.getKeyPair(transaction.from);

    const transactionDataStr = this.serializeTransaction(transactionData);

    if (signatureScheme === 'ed25519') {
      return verifyEd25519Signature(publicKey, signature, transactionDataStr);
    } else if (signatureScheme === 'ecdsa') {
      return verifyECDSASignature(publicKey, signature, transactionDataStr);
    } else {
      throw new Error('Unsupported signature scheme');
    }
  }

  private static signEd25519(data: string, privateKey: string): string {
    const { signature } = generateKeypair(privateKey);
    return signature.toString('hex');
  }

  private static signECDSA(data: string, privateKey: string): string {
    return signECDSA(data, privateKey);
  }

  private static serializeTransaction(transaction: any): string {
    const { from, to, value, data, nonce, gasLimit, gasPrice, signatureScheme } = transaction;
    return JSON.stringify({ from, to, value, data, nonce, gasLimit, gasPrice, signatureScheme });
  }

  private static getKeyPair(publicKey: string): KeyPair {
    return { publicKey, privateKey: '' };
  }
}