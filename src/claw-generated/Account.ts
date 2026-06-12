import { Transaction } from '../transaction/Transaction';
import { Signature } from '../crypto/Signature';

abstract class Account {
  abstract getBalance(): Promise<number>;
  abstract sign(tx: Transaction): Promise<Signature>;
  abstract verify(tx: Transaction, signature: Signature): Promise<boolean>;
}

export { Account };