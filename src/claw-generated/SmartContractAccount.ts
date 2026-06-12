import { Account } from './Account';
import { Transaction } from '../transaction/Transaction';
import { Signature } from '../crypto/Signature';
import { SmartContract } from '../smart-contract/SmartContract';

class SmartContractAccount extends Account {
  private contract: SmartContract;

  constructor(contract: SmartContract) {
    super();
    this.contract = contract;
  }

  async getBalance(): Promise<number> {
    // Implement balance retrieval logic for smart contract wallets
    return await this.contract.getBalance();
  }

  async sign(tx: Transaction): Promise<Signature> {
    // Delegate signing to the smart contract's validation logic
    return await this.contract.sign(tx);
  }

  async verify(tx: Transaction, signature: Signature): Promise<boolean> {
    // Delegate signature verification to the smart contract's validation logic
    return await this.contract.verify(tx, signature);
  }
}

export { SmartContractAccount };