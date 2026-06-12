import { Transaction } from '../core/Transaction';
import { AbstractAccount } from './AbstractAccount';

export class MultiSigAccount extends AbstractAccount {
  private signers: string[];

  constructor(address: string, signers: string[]) {
    super(address);
    this.signers = signers;
  }

  validateTransaction(tx: Transaction): boolean {
    // Custom validation logic for multi-sig accounts
    return this.signers.includes(tx.from) && this.balance >= tx.amount;
  }
}