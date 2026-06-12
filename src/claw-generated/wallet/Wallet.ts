import { TransactionSigner } from '../crypto/transaction-signer';
import { KeyPair, generateKeypair } from './keypair';

export class Wallet {
  private keyPair: KeyPair;
  private signatureScheme: 'ed25519' | 'ecdsa' | 'secp256k1' = 'ed25519';

  constructor(keyPair?: KeyPair) {
    this.keyPair = keyPair || generateKeypair();
  }

  getKeyPair(): KeyPair {
    return this.keyPair;
  }

  getPublicKey(): string {
    return this.keyPair.publicKey;
  }

  setSignatureScheme(scheme: 'ed25519' | 'ecdsa' | 'secp256k1'): void {
    this.signatureScheme = scheme;
  }

  signTransaction(transaction: any): any {
    return TransactionSigner.signTransaction(transaction, this.keyPair, this.signatureScheme);
  }

  verifySignature(transaction: any): boolean {
    return TransactionSigner.verifySignature(transaction);
  }
}