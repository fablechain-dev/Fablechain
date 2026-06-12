import { Account } from './Account';
import { Transaction } from './Transaction';
import { getContractAddress } from './utils';
import { StateManager } from './StateManager';

export class ContractDeployer {
  private account: Account;
  private stateManager: StateManager;
  private nonce: number = 0;

  constructor(account: Account, stateManager: StateManager) {
    this.account = account;
    this.stateManager = stateManager;
  }

  async deployContract(byteCode: string, abi: any): Promise<string> {
    const transaction = this.createDeploymentTransaction(byteCode);
    const signature = await this.account.signTransaction(transaction);
    const contractAddress = getContractAddress(this.account.address, this.nonce);

    // Store contract metadata
    await this.stateManager.storeContract(contractAddress, byteCode, abi);
    this.stateManager.emitContractDeployedEvent(contractAddress, this.account.address);

    this.nonce++;
    return contractAddress;
  }

  private createDeploymentTransaction(byteCode: string): Transaction {
    return {
      from: this.account.address,
      to: '0x0',
      data: byteCode,
      nonce: this.nonce,
      value: '0',
      gasLimit: 1000000,
      gasPrice: '1000000000'
    };
  }
}