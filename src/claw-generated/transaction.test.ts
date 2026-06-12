import { Account } from '../blockchain/account';
import { Transaction } from './transaction';

describe('Transaction', () => {
  it('should validate a valid transaction', () => {
    const sender = new Account('sender', 1000);
    const recipient = new Account('recipient', 0);
    const transaction = new Transaction(sender, recipient, 100, 1, 'valid_signature');

    expect(transaction.validate()).toBe(true);
  });

  it('should invalidate a transaction with incorrect signature', () => {
    const sender = new Account('sender', 1000);
    const recipient = new Account('recipient', 0);
    const transaction = new Transaction(sender, recipient, 100, 1, 'invalid_signature');

    expect(transaction.validate()).toBe(false);
  });

  it('should invalidate a transaction with incorrect nonce', () => {
    const sender = new Account('sender', 1000);
    const recipient = new Account('recipient', 0);
    const transaction = new Transaction(sender, recipient, 100, 2, 'valid_signature');

    expect(transaction.validate()).toBe(false);
  });

  it('should invalidate a transaction with insufficient balance', () => {
    const sender = new Account('sender', 50);
    const recipient = new Account('recipient', 0);
    const transaction = new Transaction(sender, recipient, 100, 1, 'valid_signature');

    expect(transaction.validate()).toBe(false);
  });
});