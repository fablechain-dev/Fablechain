import { StateManager } from './StateManager';
import { BlockStore } from './BlockStore';
import { Transaction } from '../transaction/Transaction';
import { Account } from '../account/Account';

describe('StateManager Integration Tests', () => {
  let stateManager: StateManager;
  let blockStore: BlockStore;

  beforeEach(() => {
    blockStore = new BlockStore();
    stateManager = new StateManager(blockStore);
  });

  test('should update account balances correctly', async () => {
    const account1 = new Account({ balance: 1000 });
    const account2 = new Account({ balance: 500 });

    // Apply a transaction that transfers 100 from account1 to account2
    const tx = new Transaction({
      fromAccount: account1.address,
      toAccount: account2.address,
      amount: 100,
    });
    await stateManager.applyTransaction(tx);

    // Verify account balances were updated correctly
    const updatedAccount1 = await stateManager.getAccountState(account1.address);
    const updatedAccount2 = await stateManager.getAccountState(account2.address);
    expect(updatedAccount1.balance).toEqual(900);
    expect(updatedAccount2.balance).toEqual(600);
  });

  test('should calculate state root correctly', async () => {
    const account1 = new Account({ balance: 1000 });
    const account2 = new Account({ balance: 500 });

    // Apply a transaction that transfers 100 from account1 to account2
    const tx = new Transaction({
      fromAccount: account1.address,
      toAccount: account2.address,
      amount: 100,
    });
    await stateManager.applyTransaction(tx);

    // Verify the state root was updated correctly
    const block1 = await stateManager.getBlock(1);
    const stateRoot1 = block1.stateRoot;
    expect(stateRoot1).not.toBeNull();

    // Apply another transaction and verify the state root changes
    const tx2 = new Transaction({
      fromAccount: account2.address,
      toAccount: account1.address,
      amount: 50,
    });
    await stateManager.applyTransaction(tx2);
    const block2 = await stateManager.getBlock(2);
    const stateRoot2 = block2.stateRoot;
    expect(stateRoot2).not.toEqual(stateRoot1);
  });

  test('should properly apply transaction changes to the state', async () => {
    const account1 = new Account({ balance: 1000 });
    const account2 = new Account({ balance: 500 });

    // Apply a transaction that transfers 100 from account1 to account2
    const tx = new Transaction({
      fromAccount: account1.address,
      toAccount: account2.address,
      amount: 100,
    });
    await stateManager.applyTransaction(tx);

    // Verify the state was updated correctly
    const updatedAccount1 = await stateManager.getAccountState(account1.address);
    const updatedAccount2 = await stateManager.getAccountState(account2.address);
    expect(updatedAccount1.balance).toEqual(900);
    expect(updatedAccount2.balance).toEqual(600);

    // Apply another transaction and verify the state was updated correctly
    const tx2 = new Transaction({
      fromAccount: account2.address,
      toAccount: account1.address,
      amount: 50,
    });
    await stateManager.applyTransaction(tx2);
    const updatedAccount1Again = await stateManager.getAccountState(account1.address);
    const updatedAccount2Again = await stateManager.getAccountState(account2.address);
    expect(updatedAccount1Again.balance).toEqual(950);
    expect(updatedAccount2Again.balance).toEqual(550);
  });
});