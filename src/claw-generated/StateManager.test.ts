import { describe, it, expect } from 'vitest';
import { StateManager } from './StateManager';
import { Account, Transaction } from '../types';

describe('StateManager', () => {
  it('should update balances correctly', () => {
    const stateManager = new StateManager();
    const account1: Account = { address: 'account1', balance: 100 };
    const account2: Account = { address: 'account2', balance: 50 };

    stateManager.applyTransaction({ from: account1.address, to: account2.address, amount: 20 });

    expect(stateManager.getBalance(account1.address)).toBe(80);
    expect(stateManager.getBalance(account2.address)).toBe(70);
  });

  it('should calculate the state root correctly', () => {
    const stateManager = new StateManager();
    const account1: Account = { address: 'account1', balance: 100 };
    const account2: Account = { address: 'account2', balance: 50 };

    stateManager.applyTransaction({ from: account1.address, to: account2.address, amount: 20 });

    expect(stateManager.getStateRoot()).not.toBe('');
  });

  it('should apply transactions correctly', () => {
    const stateManager = new StateManager();
    const account1: Account = { address: 'account1', balance: 100 };
    const account2: Account = { address: 'account2', balance: 50 };

    const tx1: Transaction = { from: account1.address, to: account2.address, amount: 20 };
    const tx2: Transaction = { from: account2.address, to: account1.address, amount: 10 };

    stateManager.applyTransaction(tx1);
    stateManager.applyTransaction(tx2);

    expect(stateManager.getBalance(account1.address)).toBe(90);
    expect(stateManager.getBalance(account2.address)).toBe(60);
  });
});