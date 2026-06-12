import { expect } from 'chai';
import { TransactionValidator } from '../transaction/transaction-validator';
import { Account } from '../account/account';
import { Transaction } from '../transaction/transaction';

describe('TransactionValidator', () => {
  let validator: TransactionValidator;
  let account: Account;

  beforeEach(() => {
    account = new Account('0x1234567890abcdef');
    validator = new TransactionValidator();
  });

  describe('verifySignature', () => {
    it('should verify a valid signature', () => {
      const tx = new Transaction({
        from: account.address,
        to: '0x0987654321fedcba',
        value: 100,
        nonce: 0,
      });
      tx.sign(account.privateKey);
      expect(validator.verifySignature(tx)).to.be.true;
    });

    it('should reject an invalid signature', () => {
      const tx = new Transaction({
        from: account.address,
        to: '0x0987654321fedcba',
        value: 100,
        nonce: 0,
      });
      tx.sign('0xdeadbeef');
      expect(validator.verifySignature(tx)).to.be.false;
    });
  });

  describe('validateNonce', () => {
    it('should validate a correct nonce', () => {
      const tx = new Transaction({
        from: account.address,
        to: '0x0987654321fedcba',
        value: 100,
        nonce: account.nonce,
      });
      expect(validator.validateNonce(tx, account)).to.be.true;
    });

    it('should reject an incorrect nonce', () => {
      const tx = new Transaction({
        from: account.address,
        to: '0x0987654321fedcba',
        value: 100,
        nonce: account.nonce + 1,
      });
      expect(validator.validateNonce(tx, account)).to.be.false;
    });
  });

  describe('validateBalance', () => {
    it('should validate a transaction with sufficient balance', () => {
      account.balance = 1000;
      const tx = new Transaction({
        from: account.address,
        to: '0x0987654321fedcba',
        value: 100,
        nonce: account.nonce,
      });
      expect(validator.validateBalance(tx, account)).to.be.true;
    });

    it('should reject a transaction with insufficient balance', () => {
      account.balance = 50;
      const tx = new Transaction({
        from: account.address,
        to: '0x0987654321fedcba',
        value: 100,
        nonce: account.nonce,
      });
      expect(validator.validateBalance(tx, account)).to.be.false;
    });
  });
});