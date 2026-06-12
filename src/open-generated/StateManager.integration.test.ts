import { StateManager } from './StateManager';
import { Account } from './Account';
import { Transaction } from './Transaction';

describe('StateManager (Integration Tests)', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  it('should update balances correctly', () => {
    // Arrange
    const address1 = '0x1234567890abcdef';
    const address2 = '0x0987654321fedcba';

    // Act
    stateManager.updateBalance(address1, 100);
    stateManager.updateBalance(address2, 50);

    // Assert
    expect(stateManager.getAccount(address1).balance).toBe(100);
    expect(stateManager.getAccount(address2).balance).toBe(50);
  });

  it('should calculate the state root correctly', () => {
    // Arrange
    const address1 = '0x1234567890abcdef';
    const address2 = '0x0987654321fedcba';

    // Act
    stateManager.updateBalance(address1, 100);
    stateManager.updateBalance(address2, 50);
    const stateRoot = stateManager.getStateRoot();

    // Assert
    expect(stateRoot).not.toBeEmpty();
  });

  it('should apply transactions correctly', () => {
    // Arrange
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

    // Act
    stateManager.applyTransaction(tx1);
    stateManager.applyTransaction(tx2);

    // Assert
    expect(stateManager.getAccount(tx1.from).balance).toBe(80);
    expect(stateManager.getAccount(tx1.to).balance).toBe(20);
    expect(stateManager.getAccount(tx2.from).balance).toBe(40);
    expect(stateManager.getAccount(tx2.to).balance).toBe(10);
  });
});