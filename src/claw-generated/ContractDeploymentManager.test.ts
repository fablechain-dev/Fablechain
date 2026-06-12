import { ContractDeploymentManager } from './ContractDeploymentManager';
import { ContractDeployer } from './ContractDeployer';
import { TransactionProcessor } from './TransactionProcessor';
import { VirtualMachine } from './VirtualMachine';
import { Account } from './Account';

describe('ContractDeploymentManager', () => {
  let contractDeploymentManager: ContractDeploymentManager;
  let contractDeployer: ContractDeployer;
  let transactionProcessor: TransactionProcessor;
  let virtualMachine: VirtualMachine;
  let account: Account;

  beforeEach(() => {
    contractDeployer = new ContractDeployer();
    transactionProcessor = new TransactionProcessor();
    virtualMachine = new VirtualMachine();
    account = new Account('0x1234567890abcdef');

    contractDeploymentManager = new ContractDeploymentManager(
      contractDeployer,
      transactionProcessor,
      virtualMachine
    );
  });

  it('should deploy a contract and return the contract address', async () => {
    const contractByteCode = '0x608060405234801561001057600080fd5b5061011e806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80632e64cec114602d575b600080fd5b60336049565b604051603e91906078565b60405180910390f35b60006001905090565b6072816091565b82525050565b6000602082019050608b6000830184606b565b92915050565b600081905091905056fea2646970667358221220c2e70b5a9d8c14fd9d9f3dbe1e5d7d4d0e9a2a8b77de2f8a1d0c7d5d6d0d0d0d0d0a64736f6c63430008070033';
    const contractAddress = await contractDeploymentManager.deployContract(account, contractByteCode);
    expect(contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should generate the correct contract address', () => {
    const contractAddress = contractDeploymentManager.getContractAddress('0x1234567890abcdef', 5);
    expect(contractAddress).toBe('0x8ba1f109551bD432803012645Ac136ddd64DBA72');
  });
});