import { Account } from '../Account';
import { Transaction } from '../Transaction';

describe('Transaction', () => {
  it('should reject transactions with nonce less than or equal to account nonce', () => {
    const account = new Account('0x1234567890');
    const tx1 = new Transaction('0x1234567890', '0x0987654321', 100, 0, 'signature');
    const tx2 = new Transaction('0x1234567890', '0x0987654321', 50, 0, 'signature');

    expect(account.validate(tx1)).toBe(true);
    expect(account.validate(tx2)).toBe(false);

    account.incrementNonce();

    const tx3 = new Transaction('0x1234567890', '0x0987654321', 75, 1, 'signature');
    expect(account.validate(tx3)).toBe(true);
  });
})