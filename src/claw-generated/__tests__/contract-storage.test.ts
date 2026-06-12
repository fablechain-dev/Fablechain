import { ContractStorage } from '../ContractStorage';

describe('ContractStorage', () => {
  let contractStorage: ContractStorage;

  beforeEach(() => {
    contractStorage = new ContractStorage();
  });

  it('should create, read, update, and delete contract storage', () => {
    const contractAddress = '0x1234567890abcdef';
    const storageKey = 'myKey';
    const initialValue = 'initial value';
    const updatedValue = 'updated value';

    // Create contract storage
    contractStorage.createContractStorage(contractAddress, storageKey, initialValue);
    expect(contractStorage.readContractStorage(contractAddress, storageKey)).toBe(initialValue);

    // Update contract storage
    contractStorage.updateContractStorage(contractAddress, storageKey, updatedValue);
    expect(contractStorage.readContractStorage(contractAddress, storageKey)).toBe(updatedValue);

    // Delete contract storage
    contractStorage.deleteContractStorage(contractAddress, storageKey);
    expect(contractStorage.readContractStorage(contractAddress, storageKey)).toBeUndefined();
  });
});