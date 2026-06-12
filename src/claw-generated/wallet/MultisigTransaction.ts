import { Signature } from '../types';
import { recoverAddress } from '../utils';

export class MultisigTransaction {
  // ... (previous code)

  addSignature(signer: string, signature: Signature): void {
    if (this.signers.includes(signer)) {
      this.signatures.push({ signer, signature });
    } else {
      throw new Error(`${signer} is not an authorized signer for this transaction`);
    }
  }

  hasEnoughSignatures(): boolean {
    return this.signatures.length >= this.minSignatures;
  }

  verifySignatures(): boolean {
    if (this.signatures.length < this.minSignatures) {
      return false;
    }

    for (const { signer, signature } of this.signatures) {
      const recoveredAddress = recoverAddress(this.data, signature);
      if (recoveredAddress !== signer) {
        return false;
      }
    }

    return true;
  }
}