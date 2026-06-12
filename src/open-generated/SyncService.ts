import { Chain } from './Chain';
import { PeerManager } from '../networking/PeerManager';
import { BlockSyncManager } from './BlockSyncManager';

export class SyncService {
  private chain: Chain;
  private peerManager: PeerManager;
  private syncManager: BlockSyncManager;

  constructor(chain: Chain, peerManager: PeerManager) {
    this.chain = chain;
    this.peerManager = peerManager;
    this.syncManager = new BlockSyncManager(this.chain, this.peerManager);
  }

  async start(): Promise<void> {
    setInterval(async () => {
      try {
        await this.syncManager.syncBlocks();
      } catch (error) {
        console.error('Error syncing blocks:', error);
      }
    }, 60000); // Sync every 60 seconds
  }
}