import { Transaction } from './Transaction';
import { Account } from './Account';
import { VirtualMachine } from './VirtualMachine';
import { ContractDeploymentManager } from './ContractDeploymentManager';

export class TransactionProcessor {
  private virtualMachine: VirtualMachine;
  private contractDeploymentManager: ContractDeploymentManager;

  constructor(virtualMachine: VirtualMachine, contractDeploymentManager: ContractDeploymentManager) {
    this.virtualMachine = virtualMachine;
    this.contractDeploymentManager = contractDeploymentManager;
  }

  async processTransaction(transaction: Transaction): Promise<void> {
    // Check if the transaction is a contract deployment
    if (transaction.to === '0x0') {
      const { from, data, nonce } = transaction;
      const account = await Account.fromAddress(from);
      const contractAddress = await this.contractDeploymentManager.deployContract(account, data, []);
      // Update the transaction to include the contract address
      transaction.to = contractAddress;
    }

    // Process the transaction through the virtual machine
    await this.virtualMachine.processTransaction(transaction);
  }
}