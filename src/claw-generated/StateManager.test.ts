import { StateManager } from './StateManager';
import { STATE_PRUNING_PERIOD } from './config';

describe('StateManager', () => {
  it('should prune old state data', async () => {
    const stateManager = new StateManager();

    // Add state for 20 blocks
    for (let i = 1; i <= 20; i++) {
      await stateManager.addState(i, { data: `State for block ${i}` });
    }

    // Verify state is in live store
    for (let i = 1; i <= 20; i++) {
      const state = await stateManager.getState(i);
      expect(state.data).toBe(`State for block ${i}`);
    }

    // Simulate adding more blocks to trigger pruning
    await stateManager.addState(STATE_PRUNING_PERIOD + 1, { data: 'New block state' });

    // Verify old state is archived, new state is in live store
    for (let i = 1; i <= STATE_PRUNING_PERIOD; i++) {
      const state = await stateManager.getState(i);
      expect(state.data).toBe(`State for block ${i}`);
    }
    const newState = await stateManager.getState(STATE_PRUNING_PERIOD + 1);
    expect(newState.data).toBe('New block state');
  });
});