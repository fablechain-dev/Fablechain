import { Account } from './account';

export class SmartContractAccount implements Account {
  private address: string;
  private nonce: number;
  private validationContract: ValidationContract;

  constructor(address: string, nonce: number, validationContract: ValidationContract) {
    this.address = address;
    this.nonce = nonce;
    this.validationContract = validationContract;
  }

  getAddress(): string {
    return this.address;
  }

  getNonce(): number {
    return this.nonce;
  }

  validateTransaction(tx: Transaction): boolean {
    return tx.from === this.address && tx.nonce === this.nonce && this.validationContract.validate(tx);
  }

  async execute(tx: Transaction): Promise&lt;void&gt; {
    // Execute the transaction
    await this.validationContract.execute(tx);
    this.nonce++;
  }
}