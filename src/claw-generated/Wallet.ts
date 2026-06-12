import { KeyPair } from '../crypto';

export class Wallet {
  private keyPairs: KeyPair[];
  private requiredSignatures: number;

  constructor(keyPairs: KeyPair[], requiredSignatures: number) {
    this.keyPairs = keyPairs;
    this.requiredSignatures = requiredSignatures;
  }

  getPublicKeys(): string[] {
    return this.keyPairs.map(kp => kp.publicKey);
  }

  getRequiredSignatures(): number {
    return this.requiredSignatures;
  }

  sign(message: string): string[] {
    const signatures = this.keyPairs.map(kp => kp.sign(message));
    return signatures;
  }

  verify(message: string, signatures: string[]): boolean {
    if (signatures.length < this.requiredSignatures) {
      return false;
    }

    for (let i = 0; i < this.requiredSignatures; i++) {
      if (!this.keyPairs[i].verify(message, signatures[i])) {
        return false;
      }
    }

    return true;
  }
}