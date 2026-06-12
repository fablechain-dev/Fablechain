import { Transaction } from '../core/transaction';
import { KeyPair } from './key-pair';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

export class TransactionSigner {
  /**
   * Sign a transaction using the provided private key.
   * @param transaction The transaction to sign
   * @param keyPair The key pair used for signing
   * @returns The signed transaction
   */
  static sign(transaction: Transaction, keyPair: KeyPair): Transaction {
    const signature = ec.sign(transaction.hash(), keyPair.getPrivateKey());
    transaction.signature = signature.toDER();
    return transaction;
  }

  /**
   * Verify the signature of a transaction.
   * @param transaction The signed transaction
   * @param keyPair The key pair used for verification
   * @returns True if the signature is valid, false otherwise
   */
  static verify(transaction: Transaction, keyPair: KeyPair): boolean {
    const signature = ec.signature(transaction.signature);
    const key = ec.keyFromPublic(keyPair.getPublicKey());
    return key.verify(transaction.hash(), signature);
  }
}