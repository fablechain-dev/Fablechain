import { PublicKey } from './crypto';

class Wallet {
  private publicKeys: PublicKey[];
  private requiredSignatures: number;

  constructor(publicKeys: PublicKey[], requiredSignatures: number) {
    this.publicKeys = publicKeys;
    this.requiredSignatures = requiredSignatures;
  }

  addPublicKey(publicKey: PublicKey) {
    this.publicKeys.push(publicKey);
  }

  removePublicKey(publicKey: PublicKey) {
    this.publicKeys = this.publicKeys.filter(key => !key.equals(publicKey));
  }

  canAuthorizeTransaction(signatures: PublicKey[]): boolean {
    // Check if the provided signatures match the required M-of-N threshold
    return signatures.length >= this.requiredSignatures;
  }

  authorizeTransaction(transaction: Transaction): boolean {
    // Aggregate the signatures and verify they meet the threshold
    const signatures = transaction.getSignatures();
    return this.canAuthorizeTransaction(signatures);
  }
}

export { Wallet };