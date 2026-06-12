import { TransactionValidator } from '../transaction-validator';
import { AccountStorage } from '../../AccountStorage';
import { ContractStorage } from '../../contracts/ContractStorage';
import { Transaction } from '../transaction';
import { BigNumber } from 'ethers';

describe('TransactionValidator', () => {
  let transactionValidator: TransactionValidator;
  let accountStorage: AccountStorage;
  let contractStorage: ContractStorage;

  beforeEach(() => {
    accountStorage = new AccountStorage();
    contractStorage = new ContractStorage();
    transactionValidator = new TransactionValidator(accountStorage, contractStorage);
  });

  test('should validate a valid transaction', async () => {
    const tx = new Transaction({
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      value: BigNumber.from(100),
      gasLimit: BigNumber.from(21000),
      gasPrice: BigNumber.from(10),
    });

    await accountStorage.setBalance('0x1234567890123456789012345678901234567890', BigNumber.from(1000));
    await accountStorage.setBalance('0x0987654321098765432109876543210987654321', BigNumber.from(1000));

    expect(await transactionValidator.validateTransaction(tx)).toBe(true);
  });

  test('should reject a transaction with insufficient sender balance', async () => {
    const tx = new Transaction({
      from: '0x1234567890123456789012345678901234567890',
      to: '0x0987654321098765432109876543210987654321',
      value: BigNumber.from(1000),
      gasLimit: BigNumber.from(21000),
      gasPrice: BigNumber.from(10),
    });

    await accountStorage.setBalance('0x1234567890123456789012345678901234567890', BigNumber.from(500));
    await accountStorage.setBalance('0x0987654321098765432109876543210987654321', BigNumber.from(1000));

    expect(await transactionValidator.validateTransaction(tx)).toBe(false);
  });

  // Add more tests for other validation scenarios
});