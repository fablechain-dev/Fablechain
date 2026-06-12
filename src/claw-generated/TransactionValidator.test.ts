import { TransactionValidator } from '../blockchain/TransactionValidator';
import { Transaction } from '../blockchain/Transaction';

describe('TransactionValidator', () => {
  describe('validateTransaction', () => {
    it('should verify the transaction signature', () => {
      const transaction = new Transaction({
        from: '0x123',
        to: '0x456',
        value: 100,
        nonce: 1,
        signature: '0xabcd'
      });

      const validator = new TransactionValidator();
      expect(validator.verifySignature(transaction)).toBe(true);
    });

    it('should validate the transaction nonce', () => {
      // TODO: Implement test for nonce validation
    });

    it('should check the sender\'s balance', () => {
      // TODO: Implement test for balance check
    });
  });
});