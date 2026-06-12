import { Account } from './account';

export class ExternallyOwnedAccount implements Account {
  private address: string;
  private nonce: number;

  constructor(address: string, nonce: number) {
    this.address = address;
    this.nonce = nonce;
  }

  getAddress(): string {
    return this.address;
  }

  getNonce(): number {
    return this.nonce;
  }

  validateTransaction(tx: Transaction): boolean {
    return tx.from === this.address && tx.nonce === this.nonce;
  }

  async execute(tx: Transaction): Promise&lt;void&gt; {
    // Execute the transaction
    this.nonce++;
  }
}