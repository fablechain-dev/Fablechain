import { MultisigTransaction } from './MultisigTransaction';
import { TransactionSigner } from './TransactionSigner';

export type WalletType = 'single-sig' | 'multi-sig';

export class Wallet {
  readonly id: string;
  readonly type: WalletType;
  readonly signers: string[];
  readonly minSignatures: number;

  constructor(id: string, type: WalletType, signers: string[], minSignatures: number) {
    this.id = id;
    this.type = type;
    this.signers = signers;
    this.minSignatures = minSignatures;
  }

  createMultisigWallet(id: string, signers: string[], minSignatures: number): Wallet {
    return new Wallet(id, 'multi-sig', signers, minSignatures);
  }

  createTransaction(data: any): MultisigTransaction {
    if (this.type === 'multi-sig') {
      const txId = this.generateTransactionId();
      return new MultisigTransaction(txId, this.signers, this.minSignatures, data);
    } else {
      throw new Error('Single-sig wallets cannot create multisig transactions');
    }
  }

  addSigner(signer: string): void {
    if (this.type === 'multi-sig') {
      this.signers.push(signer);
    } else {
      throw new Error('Single-sig wallets cannot add signers');
    }
  }

  removeSigner(signer: string): void {
    if (this.type === 'multi-sig') {
      this.signers = this.signers.filter(s => s !== signer);
    } else {
      throw new Error('Single-sig wallets cannot remove signers');
    }
  }

  private generateTransactionId(): string {
    // Implement transaction ID generation logic
    return 'tx-' + Math.random().toString(36).substring(2, 10);
  }
}