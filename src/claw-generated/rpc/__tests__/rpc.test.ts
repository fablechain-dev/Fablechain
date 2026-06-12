import { describe, it, expect } from 'vitest';
import { simulateTransaction, getSignaturesForAddress } from '../transaction';
import { Account } from '../../wallet/account';
import { Transaction } from '../transaction';

describe('RPC Endpoints', () => {
  describe('simulateTransaction', () => {
    it('should simulate a valid transaction', async () => {
      const account = new Account();
      const transaction = new Transaction();
      // Set up a valid transaction
      const [logs, gasUsed] = await simulateTransaction(account, transaction);
      expect(logs).toEqual(expect.any(Array));
      expect(gasUsed).toBeGreaterThan(0);
    });

    it('should return an error for an invalid transaction', async () => {
      const account = new Account();
      const transaction = new Transaction();
      // Set up an invalid transaction
      await expect(simulateTransaction(account, transaction)).rejects.toThrow();
    });
  });

  describe('getSignaturesForAddress', () => {
    it('should return signatures for a valid account', async () => {
      const account = new Account();
      const signatures = await getSignaturesForAddress(account, 0, 10);
      expect(signatures).toEqual(expect.any(Array));
    });

    it('should return an error for an invalid account', async () => {
      await expect(getSignaturesForAddress(null as any, 0, 10)).rejects.toThrow();
    });

    it('should handle a large number of transactions', async () => {
      const account = new Account();
      // Generate a large number of transactions for the account
      for (let i = 0; i < 1000; i++) {
        await account.addTransaction(new Transaction());
      }
      const signatures = await getSignaturesForAddress(account, 0, 100);
      expect(signatures.length).toBe(100);
    });
  });
});