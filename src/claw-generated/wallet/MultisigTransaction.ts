import { TransactionSigner } from './TransactionSigner';

export class MultisigTransaction {
  readonly id: string;
  readonly signers: string[];
  readonly minSignatures: number;
  readonly data: any;
  private signatures: { [signer: string]: string } = {};
  private isSubmitted: boolean = false;

  constructor(id: string, signers: string[], minSignatures: number, data: any) {
    this.id = id;
    this.signers = signers;
    this.minSignatures = minSignatures;
    this.data = data;
  }

  proposeTransaction(): void {
    // Implement logic to propose the transaction to the network
  }

  addSignature(signer: string, signature: string): void {
    this.signatures[signer] = signature;
  }

  verifySignatures(): boolean {
    // Check that the required number of valid signatures are provided
    const validSignatures = Object.keys(this.signatures).filter(signer => this.signers.includes(signer));
    return validSignatures.length >= this.minSignatures;
  }

  submitTransaction(): void {
    if (this.verifySignatures()) {
      // Implement logic to submit the transaction to the network
      this.isSubmitted = true;
    } else {
      throw new Error('Unable to submit transaction due to insufficient valid signatures');
    }
  }

  isTransactionSubmitted(): boolean {
    return this.isSubmitted;
  }
}