import { StateManager } from './StateManager';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  it('should get and update accounts', () => {
    const address = '0x1234567890';
    const account = new Account();
    account.balance = 100;

    stateManager.updateAccount(address, account);
    const retrievedAccount = stateManager.getAccount(address);

    expect(retrievedAccount.balance).toEqual(100);
  });

  it('should calculate state root', () => {
    // Arrange
    const address1 = '0x1234567890';
    const account1 = new Account();
    account1.balance = 100;

    const address2 = '0x0987654321';
    const account2 = new Account();
    account2.balance = 50;

    stateManager.updateAccount(address1, account1);
    stateManager.updateAccount(address2, account2);

    // Act
    const stateRoot = stateManager.getStateRoot();

    // Assert
    expect(stateRoot).toEqual('0x1234567890abcdef');
  });

  it('should apply transactions', () => {
    // Arrange
    const senderAddress = '0x1234567890';
    const senderAccount = new Account();
    senderAccount.balance = 100;
    senderAccount.nonce = 0;

    const receiverAddress = '0x0987654321';
    const receiverAccount = new Account();
    receiverAccount.balance = 50;

    stateManager.updateAccount(senderAddress, senderAccount);
    stateManager.updateAccount(receiverAddress, receiverAccount);

    const transaction = new Transaction({
      from: senderAddress,
      to: receiverAddress,
      value: 20,
      nonce: 0,
    });

    // Act
    stateManager.applyTransaction(transaction);

    // Assert
    const updatedSenderAccount = stateManager.getAccount(senderAddress);
    const updatedReceiverAccount = stateManager.getAccount(receiverAddress);

    expect(updatedSenderAccount.balance).toEqual(80);
    expect(updatedSenderAccount.nonce).toEqual(1);
    expect(updatedReceiverAccount.balance).toEqual(70);
  });
});