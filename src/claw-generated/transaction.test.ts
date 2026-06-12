import { Transaction } from '../blockchain/transaction';
import { Account } from '../blockchain/account';

describe('Transaction Validation', () => {
  it('should verify a valid signature', () => {
    const account = new Account('0x1234567890abcdef');
    const tx = new Transaction(account.address, '0x0987654321fedcba', 100, 1, 'valid_signature');

    expect(tx.verify(account)).toBe(true);
  });

  it('should detect an invalid signature', () => {
    const account = new Account('0x1234567890abcdef');
    const tx = new Transaction(account.address, '0x0987654321fedcba', 100, 1, 'invalid_signature');

    expect(tx.verify(account)).toBe(false);
  });

  it('should validate a correct nonce', () => {
    const account = new Account('0x1234567890abcdef');
    account.nonce = 1;
    const tx = new Transaction(account.address, '0x0987654321fedcba', 100, 1, 'valid_signature');

    expect(tx.validateNonce(account)).toBe(true);
  });

  it('should detect an incorrect nonce', () => {
    const account = new Account('0x1234567890abcdef');
    account.nonce = 1;
    const tx = new Transaction(account.address, '0x0987654321fedcba', 100, 2, 'valid_signature');

    expect(tx.validateNonce(account)).toBe(false);
  });

  it('should validate a sufficient balance', () => {
    const account = new Account('0x1234567890abcdef');
    account.balance = 1000;
    const tx = new Transaction(account.address, '0x0987654321fedcba', 100, 1, 'valid_signature');

    expect(tx.validateBalance(account)).toBe(true);
  });

  it('should detect an insufficient balance', () => {
    const account = new Account('0x1234567890abcdef');
    account.balance = 50;
    const tx = new Transaction(account.address, '0x0987654321fedcba', 100, 1, 'valid_signature');

    expect(tx.validateBalance(account)).toBe(false);
  });
});