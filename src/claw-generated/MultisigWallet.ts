import { PublicKey } from 'crypto';

class MultisigWallet {
  private m: number; // Minimum number of signatures required
  private n: number; // Total number of authorized signers
  private signers: PublicKey[]; // List of authorized signer public keys

  constructor(m: number, n: number, signers: PublicKey[]) {
    this.m = m;
    this.n = n;
    this.signers = signers;
  }

  addSigner(signer: PublicKey): void {
    this.signers.push(signer);
    this.n++;
  }

  removeSigner(signer: PublicKey): void {
    this.signers = this.signers.filter((s) => !s.equals(signer));
    this.n--;
  }

  updateThreshold(m: number, n: number): void {
    this.m = m;
    this.n = n;
  }

  getSigners(): PublicKey[] {
    return this.signers;
  }

  getThreshold(): { m: number; n: number } {
    return { m: this.m, n: this.n };
  }
}

export { MultisigWallet };