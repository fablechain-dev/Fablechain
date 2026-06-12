import { StateManager } from '../state/StateManager';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  it('should update balances correctly', () => {
    // Test balance updates
    const address1 = '0x1234567890abcdef';
    const address2 = '0x0987654321fedcba';

    stateManager.updateBalance(address1, 100);
    stateManager.updateBalance(address2, 50);

    expect(stateManager.getAccount(address1).balance).toBe(100);
    expect(stateManager.getAccount(address2).balance).toBe(50);
  });

  it('should calculate the state root correctly', () => {
    // Test state root calculation
    const address1 = '0x1234567890abcdef';
    const address2 = '0x0987654321fedcba';

    stateManager.updateBalance(address1, 100);
    stateManager.updateBalance(address2, 50);

    const stateRoot = stateManager.getStateRoot();
    expect(stateRoot).not.toBeEmpty();
  });

  it('should apply transactions correctly', () => {
    // Test transaction application
    const tx1 = new Transaction({
      from: '0x1234567890abcdef',
      to: '0x0987654321fedcba',
      amount: 20,
    });

    const tx2 = new Transaction({
      from: '0x0987654321fedcba',
      to: '0x1234567890abcdef',
      amount: 10,
    });

    stateManager.updateBalance(tx1.from, 100);
    stateManager.updateBalance(tx2.from, 50);

    stateManager.applyTransaction(tx1);
    stateManager.applyTransaction(tx2);

    expect(stateManager.getAccount(tx1.from).balance).toBe(80);
    expect(stateManager.getAccount(tx1.to).balance).toBe(20);
    expect(stateManager.getAccount(tx2.from).balance).toBe(40);
    expect(stateManager.getAccount(tx2.to).balance).toBe(10);
  });
});