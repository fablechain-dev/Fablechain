import { Account } from './Account';
import { ContractDeployer } from './ContractDeployer';
import { StateManager } from './StateManager';
import { getContractAddress } from './utils';

export class ContractDeploymentManager {
  private contractDeployer: ContractDeployer;

  constructor(account: Account, stateManager: StateManager) {
    this.contractDeployer = new ContractDeployer(account, stateManager);
  }

  async deployContract(byteCode: string, abi: any): Promise<string> {
    const contractAddress = await this.contractDeployer.deployContract(byteCode, abi);
    return contractAddress;
  }

  getContractAddress(accountAddress: string, nonce: number): string {
    return getContractAddress(accountAddress, nonce);
  }
}