import { Transaction } from '../core/transaction';
import { PublicKey } from '../core/crypto';

export abstract class Account {
  abstract publicKey: PublicKey;

  abstract validateTransaction(tx: Transaction): boolean;

  abstract sign(data: Uint8Array): Uint8Array;
}