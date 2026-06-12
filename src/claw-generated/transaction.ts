import { Account } from '../blockchain/account';

export class Transaction {
  sender: Account;
  recipient: Account;
  amount: number;
  nonce: number;
  signature: string;

  constructor(sender: Account, recipient: Account, amount: number, nonce: number, signature: string) {
    this.sender = sender;
    this.recipient = recipient;
    this.amount = amount;
    this.nonce = nonce;
    this.signature = signature;
  }

  validate(): boolean {
    // Signature verification
    if (!this.sender.verifySignature(this.signature)) {
      return false;
    }

    // Nonce validation
    if (this.sender.nonce !== this.nonce) {
      return false;
    }

    // Balance check
    if (this.sender.balance < this.amount) {
      return false;
    }

    return true;
  }
}