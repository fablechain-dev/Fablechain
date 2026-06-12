import { ContractDeployer } from './deployment';
import { Account } from '../core/account';
import { Transaction } from '../core/transaction';

describe('ContractDeployer', () => {
  it('should deploy a contract', async () => {
    const account = new Account('0x...'); // Replace with a real private key
    const deployer = new ContractDeployer(account);
    const bytecode = '0x...'; // Replace with real contract bytecode
    const receipt = await deployer.deployContract(bytecode, []);
    expect(receipt.contractAddress).toBeDefined();
  });

  it('should calculate the correct contract address', () => {
    const account = new Account('0x...');
    const deployer = new ContractDeployer(account);
    const transaction = new Transaction({
      from: account.address,
      nonce: 0,
    });
    const address = deployer.getContractAddress(transaction);
    expect(address).toMatch(/^0x[0-9a-f]{40}$/);
  });
});