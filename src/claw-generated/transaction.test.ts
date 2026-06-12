import { Transaction } from './transaction';
import { Account } from '../blockchain/account';

describe('Transaction', () => {
  let account: Account;

  beforeEach(() => {
    account = new Account('0x1234', 100, 0);
  });

  it('should calculate the correct fee', () => {
    const tx = new Transaction('0x1234', '0x5678', 10, 0, 'signature', 0.01);
    expect(tx.fee).toEqual(0.01);
  });

  it('should validate the balance with the fee', () => {
    const tx = new Transaction('0x1234', '0x5678', 10, 0, 'signature', 0.01);
    expect(tx.validateBalance(account)).toBe(true);
  });

  it('should fail to validate the balance if the fee is too high', () => {
    const tx = new Transaction('0x1234', '0x5678', 100, 0, 'signature', 1);
    expect(tx.validateBalance(account)).toBe(false);
  });
});