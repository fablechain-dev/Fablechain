// Transaction Signing Library

import { Signature, SignatureScheme, ECDSAScheme, Ed25519Scheme } from './signature-schemes';

export class TransactionSigner {
  private signatureScheme: SignatureScheme;

  constructor(signatureScheme: SignatureScheme = new ECDSAScheme()) {
    this.signatureScheme = signatureScheme;
  }

  /**
   * Sign a transaction using the configured signature scheme.
   * @param transaction The transaction to sign
   * @returns The signed transaction
   */
  sign(transaction: any): Signature {
    return this.signatureScheme.sign(transaction);
  }

  /**
   * Verify the signature of a transaction.
   * @param transaction The transaction to verify
   * @param signature The signature to verify
   * @returns True if the signature is valid, false otherwise
   */
  verify(transaction: any, signature: Signature): boolean {
    return this.signatureScheme.verify(transaction, signature);
  }

  /**
   * Create a new TransactionSigner with the ECDSA signature scheme.
   * @returns A new TransactionSigner instance
   */
  static createECDSASigner(): TransactionSigner {
    return new TransactionSigner(new ECDSAScheme());
  }

  /**
   * Create a new TransactionSigner with the Ed25519 signature scheme.
   * @returns A new TransactionSigner instance
   */
  static createEd25519Signer(): TransactionSigner {
    return new TransactionSigner(new Ed25519Scheme());
  }
}