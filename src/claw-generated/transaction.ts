import { Account } from '../blockchain/account';

export class Transaction {
  from: string;
  to: string;
  value: number;
  nonce: number;
  signature: string;

  constructor(from: string, to: string, value: number, nonce: number, signature: string) {
    this.from = from;
    this.to = to;
    this.value = value;
    this.nonce = nonce;
    this.signature = signature;
  }

  verify(account: Account): boolean {
    // Implement signature verification logic
    return account.verifySignature(this.from, this.signature);
  }

  validateNonce(account: Account): boolean {
    // Implement nonce validation logic
    return account.nonce === this.nonce;
  }

  validateBalance(account: Account): boolean {
    // Implement balance check logic
    return account.balance >= this.value;
  }
}