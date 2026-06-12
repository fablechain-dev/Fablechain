import { Wallet } from './Wallet';
import { sha256 } from '../crypto';

export class Transaction {
  inputs: TransactionInput[];
  outputs: TransactionOutput[];

  constructor(inputs: TransactionInput[], outputs: TransactionOutput[]) {
    this.inputs = inputs;
    this.outputs = outputs;
  }

  verify(): boolean {
    // Verify inputs
    for (const input of this.inputs) {
      if (!input.wallet.verify(this.getSignatureMessage(), input.signatures)) {
        return false;
      }
    }

    // Verify outputs
    let totalInput = 0;
    let totalOutput = 0;
    for (const input of this.inputs) {
      totalInput += input.amount;
    }
    for (const output of this.outputs) {
      totalOutput += output.amount;
    }
    return totalInput >= totalOutput;
  }

  private getSignatureMessage(): string {
    // Generate a message to be signed by input wallets
    const inputsHash = this.inputs.map(i => sha256(i.wallet.getPublicKeys().join(''))).join('');
    const outputsHash = this.outputs.map(o => sha256(o.wallet.getPublicKeys().join(''))).join('');
    return `ClawChain Transaction: ${inputsHash} -> ${outputsHash}`;
  }
}

interface TransactionInput {
  wallet: Wallet;
  amount: number;
  signatures: string[];
}

interface TransactionOutput {
  wallet: Wallet;
  amount: number;
}