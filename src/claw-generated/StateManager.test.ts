import StateManager from './StateManager';
import { Block } from '../blockchain/Block';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  it('should store and retrieve state', () => {
    const block = new Block(1, 'previous-hash', 'transactions', 'timestamp');
    const state = { accounts: { '0x123': { balance: 100 } } };

    stateManager.storeState(block.hash, state);
    const retrievedState = stateManager.retrieveState(block.hash);

    expect(retrievedState).toEqual(state);
  });

  it('should prune old state', async () => {
    const block1 = new Block(1, 'previous-hash', 'transactions', 'timestamp');
    const block2 = new Block(2, block1.hash, 'transactions', 'timestamp');
    const block3 = new Block(3, block2.hash, 'transactions', 'timestamp');

    stateManager.storeState(block1.hash, { accounts: { '0x123': { balance: 100 } } });
    stateManager.storeState(block2.hash, { accounts: { '0x123': { balance: 200 } } });
    stateManager.storeState(block3.hash, { accounts: { '0x123': { balance: 300 } } });

    await stateManager.pruneState(2);

    expect(stateManager.retrieveState(block1.hash)).toBeUndefined();
    expect(stateManager.retrieveState(block2.hash)).not.toBeUndefined();
    expect(stateManager.retrieveState(block3.hash)).not.toBeUndefined();
  });
});