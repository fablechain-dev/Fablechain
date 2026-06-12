import { MultisigTransaction } from './MultisigTransaction';
import { TransactionSigner } from './TransactionSigner';

export class Wallet {
  readonly id: string;
  readonly signers: string[];
  readonly minSignatures: number;

  constructor(id: string, signers: string[], minSignatures: number) {
    this.id = id;
    this.signers = signers;
    this.minSignatures = minSignatures;
  }

  createTransaction(data: any): MultisigTransaction {
    const txId = this.generateTransactionId();
    return new MultisigTransaction(txId, this.signers, this.minSignatures, data);
  }

  addSignature(tx: MultisigTransaction, signer: string, signature: string): void {
    tx.addSignature(signer, signature);
  }

  verifyTransaction(tx: MultisigTransaction): boolean {
    return tx.verify();
  }

  private generateTransactionId(): string {
    // Implement transaction ID generation logic
    return 'tx-' + Math.random().toString(36).substring(2, 10);
  }
}