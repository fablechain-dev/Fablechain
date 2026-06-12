import { StateManager } from './StateManager';
import { Account } from '../account/Account';
import { Block } from '../block/Block';
import { Transaction } from '../transaction/Transaction';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  it('should update balances correctly', () => {
    // Arrange
    const sender = new Account('sender', 100);
    const receiver = new Account('receiver', 0);
    const tx = new Transaction(sender.address, receiver.address, 50);

    // Act
    stateManager.applyTransaction(tx);

    // Assert
    expect(stateManager.getAccount(sender.address).balance).toBe(50);
    expect(stateManager.getAccount(receiver.address).balance).toBe(50);
  });

  it('should calculate the state root correctly', () => {
    // Arrange
    const sender = new Account('sender', 100);
    const receiver = new Account('receiver', 0);
    const tx = new Transaction(sender.address, receiver.address, 50);
    const block = new Block([tx], '');

    // Act
    stateManager.applyBlock(block);
    const stateRoot = stateManager.getStateRoot();

    // Assert
    expect(stateRoot).not.toBe('');
  });

  it('should apply transactions correctly', () => {
    // Arrange
    const sender = new Account('sender', 100);
    const receiver = new Account('receiver', 0);
    const tx = new Transaction(sender.address, receiver.address, 50);
    const block = new Block([tx], '');

    // Act
    stateManager.applyTransaction(tx);
    stateManager.applyBlock(block);

    // Assert
    expect(stateManager.getAccount(sender.address).balance).toBe(50);
    expect(stateManager.getAccount(receiver.address).balance).toBe(50);
    expect(stateManager.getStateRoot()).not.toBe('');
  });
});