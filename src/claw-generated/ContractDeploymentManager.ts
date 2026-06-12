import { ContractDeployer } from './ContractDeployer';
import { TransactionProcessor } from './TransactionProcessor';
import { Account } from './Account';
import { VirtualMachine } from './VirtualMachine';
import { toHex, keccak256 } from './utils';

export class ContractDeploymentManager {
  private contractDeployer: ContractDeployer;
  private transactionProcessor: TransactionProcessor;
  private virtualMachine: VirtualMachine;

  constructor(
    contractDeployer: ContractDeployer,
    transactionProcessor: TransactionProcessor,
    virtualMachine: VirtualMachine
  ) {
    this.contractDeployer = contractDeployer;
    this.transactionProcessor = transactionProcessor;
    this.virtualMachine = virtualMachine;
  }

  async deployContract(
    account: Account,
    contractByteCode: string,
    constructorArgs: any[] = []
  ): Promise<string> {
    // Compile the contract
    const { bytecode, abi } = await this.contractDeployer.compileContract(contractByteCode, constructorArgs);

    // Get the next nonce for the account
    const nonce = await account.getNextNonce();

    // Generate the contract address
    const contractAddress = this.getContractAddress(account.address, nonce);

    // Create and sign the deployment transaction
    const deploymentTx = await this.contractDeployer.createDeploymentTransaction(
      account,
      bytecode,
      contractAddress,
      nonce
    );
    await this.transactionProcessor.processTransaction(deploymentTx);

    // Return the contract address
    return contractAddress;
  }

  private getContractAddress(
    deployerAddress: string,
    nonce: number
  ): string {
    const contractAddressBytes = keccak256(
      Buffer.concat([
        Buffer.from(deployerAddress.slice(2), 'hex'),
        Buffer.from(nonce.toString(16).padStart(64, '0'), 'hex')
      ])
    );
    return '0x' + contractAddressBytes.slice(64 - 40);
  }
}