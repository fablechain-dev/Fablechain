import { StateManager } from './StateManager';
import { MerklePatriciaTrie } from './MerklePatriciaTrie';

jest.mock('./MerklePatriciaTrie');

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  test('should get state root', () => {
    (MerklePatriciaTrie as jest.MockedClass<typeof MerklePatriciaTrie>).prototype.getRoot.mockReturnValue('root');
    expect(stateManager.getStateRoot()).toEqual('root');
  });

  test('should set state', () => {
    stateManager.setState('key', 'value');
    expect(MerklePatriciaTrie.prototype.set).toHaveBeenCalledWith('key', 'value');
  });

  test('should get state', () => {
    (MerklePatriciaTrie as jest.MockedClass<typeof MerklePatriciaTrie>).prototype.get.mockReturnValue('value');
    expect(stateManager.getState('key')).toEqual('value');
  });

  test('should get proof', () => {
    stateManager.getProof('key');
    expect(MerklePatriciaTrie.prototype.getProof).toHaveBeenCalledWith('key');
  });

  test('should verify proof', () => {
    (MerklePatriciaTrie as jest.MockedClass<typeof MerklePatriciaTrie>).prototype.verifyProof.mockReturnValue(true);
    expect(stateManager.verifyProof('key', 'value', ['proof'])).toBe(true);
  });

  test('should handle concurrent access', async () => {
    const numThreads = 10;
    const numOperations = 1000;

    const promises = [];
    for (let i = 0; i < numThreads; i++) {
      promises.push(
        new Promise((resolve) => {
          for (let j = 0; j < numOperations; j++) {
            stateManager.setState(`key-${i}-${j}`, `value-${i}-${j}`);
          }
          resolve();
        })
      );
    }

    await Promise.all(promises);

    expect(MerklePatriciaTrie.prototype.set).toHaveBeenCalledTimes(numThreads * numOperations);
  });
});