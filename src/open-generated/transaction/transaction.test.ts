import { TransactionValidator } from './transaction-validator';
import { Transaction } from './transaction';

describe('TransactionValidator', () => {
  test('should validate a valid transaction', async () => {
    // Create a valid transaction
    const validTx = new Transaction({
      from: '0x123456789abcdef',
      to: '0xfedcba9876543210',
      value: 100,
      nonce: 1,
      signature: '0x...'
    });

    await expect(TransactionValidator.validate(validTx)).resolves.not.toThrow();
  });

  test('should throw an error for an invalid transaction format', async () => {
    // Create an invalid transaction
    const invalidTx = new Transaction({
      from: 'invalid-address',
      to: '0xfedcba9876543210',
      value: 100,
      nonce: 1,
      signature: '0x...'
    });

    await expect(TransactionValidator.validate(invalidTx)).rejects.toThrow('Invalid transaction format');
  });

  test('should throw an error for an invalid transaction signature', async () => {
    // Create a transaction with an invalid signature
    const invalidSignatureTx = new Transaction({
      from: '0x123456789abcdef',
      to: '0xfedcba9876543210',
      value: 100,
      nonce: 1,
      signature: 'invalid-signature'
    });

    await expect(TransactionValidator.validate(invalidSignatureTx)).rejects.toThrow();
  });
});