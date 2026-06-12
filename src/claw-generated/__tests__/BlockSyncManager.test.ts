import { Chain } from '../Chain';
import { Block } from '../Block';
import { PeerManager } from '../networking/PeerManager';
import { ConnectionPool } from '../ConnectionPool';
import { BlockSyncManager } from '../BlockSyncManager';

describe('BlockSyncManager', () => {
  let chain: Chain;
  let peerManager: PeerManager;
  let connectionPool: ConnectionPool;
  let blockSyncManager: BlockSyncManager;

  beforeEach(() => {
    chain = new Chain();
    peerManager = new PeerManager();
    connectionPool = new ConnectionPool();
    blockSyncManager = new BlockSyncManager(chain, peerManager, connectionPool);
  });

  test('syncBlocks', async () => {
    // Mock the peer manager and connection pool
    const peer1 = {
      getBlockHeight: jest.fn().mockResolvedValue(100),
      getBlockHash: jest.fn().mockResolvedValue('block-hash-1'),
    };
    const peer2 = {
      getBlockHeight: jest.fn().mockResolvedValue(101),
      getBlockHash: jest.fn().mockResolvedValue('block-hash-2'),
    };
    peerManager.getConnectedPeers = jest.fn().mockReturnValue([peer1, peer2]);

    connectionPool.downloadBlock = jest.fn()
      .mockResolvedValueOnce(new Block({ hash: 'block-hash-1' }))
      .mockResolvedValueOnce(new Block({ hash: 'block-hash-2' }));

    // Run the sync
    await blockSyncManager.syncBlocks();

    // Verify the expected behavior
    expect(chain.getBlocks().length).toBe(2);
    expect(chain.hasBlock('block-hash-1')).toBe(true);
    expect(chain.hasBlock('block-hash-2')).toBe(true);
    expect(peer1.getBlockHeight).toHaveBeenCalled();
    expect(peer2.getBlockHeight).toHaveBeenCalled();
    expect(connectionPool.downloadBlock).toHaveBeenCalledTimes(2);
  });
});