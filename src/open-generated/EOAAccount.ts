import { Account } from './Account';
import { Transaction } from '../transaction/Transaction';
import { Signature } from '../crypto/Signature';
import { KeyPair } from '../crypto/KeyPair';

class EOAAccount extends Account {
  private keyPair: KeyPair;

  constructor(keyPair: KeyPair) {
    super();
    this.keyPair = keyPair;
  }

  async getBalance(): Promise<number> {
    // Implement balance retrieval logic for externally owned accounts
    return 0;
  }

  async sign(tx: Transaction): Promise<Signature> {
    // Sign the transaction using the account's private key
    return this.keyPair.sign(tx);
  }

  async verify(tx: Transaction, signature: Signature): Promise<boolean> {
    // Verify the transaction signature using the account's public key
    return this.keyPair.verify(tx, signature);
  }
}

export { EOAAccount };