import { TransactionSigner } from './TransactionSigner';

export class MultisigTransaction {
  readonly id: string;
  readonly signers: string[];
  readonly minSignatures: number;
  readonly data: any;
  private signatures: { [signer: string]: string } = {};

  constructor(id: string, signers: string[], minSignatures: number, data: any) {
    this.id = id;
    this.signers = signers;
    this.minSignatures = minSignatures;
    this.data = data;
  }

  addSignature(signer: string, signature: string): void {
    this.signatures[signer] = signature;
  }

  verify(): boolean {
    // Check that the required number of valid signatures are provided
    const validSignatures = Object.keys(this.signatures).filter(signer => this.signers.includes(signer));
    return validSignatures.length >= this.minSignatures;
  }
}