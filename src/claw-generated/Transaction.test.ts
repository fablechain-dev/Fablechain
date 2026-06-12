import { Account } from './Account';
import { Transaction } from './Transaction';

describe('Transaction', () => {
  test('should update storage slots', () => {
    const fromAccount = new Account('0x1234', 100, 0);
    const toAccount = new Account('0x5678', 50, 0);
    const accounts = new Map([
      ['0x1234', fromAccount],
      ['0x5678', toAccount]
    ]);

    const tx = new Transaction('0x1234', '0x5678', 10, '0x0123456789012345678901234567890123456789012345678901234567890123abcd', 0);
    tx.execute(accounts);

    expect(fromAccount.balance).toBe(90);
    expect(toAccount.balance).toBe(60);
    expect(fromAccount.nonce).toBe(1);
    expect(fromAccount.getStorageSlot('0x0123456789012345678901234567890123456789012345678901234567890123')).toBe('abcd');
  });
});