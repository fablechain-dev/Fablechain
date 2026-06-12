import { Account } from './Account';
import { ContractDeployer } from './ContractDeployer';
import { StateManager } from './StateManager';
import { getContractAddress } from './utils';

describe('ContractDeployer', () => {
  it('should deploy a contract and return the correct address', async () => {
    const account = new Account('0x1234567890abcdef');
    const stateManager = new StateManager();
    const deployer = new ContractDeployer(account, stateManager);
    const byteCode = '0x12345678';
    const abi = [{ "inputs": [], "name": "myFunction", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];
    const contractAddress = await deployer.deployContract(byteCode, abi);
    const expectedAddress = getContractAddress(account.address, 0);
    expect(contractAddress).toEqual(expectedAddress);
    expect(stateManager.getContract(contractAddress)).toEqual({ byteCode, abi });
  });
});