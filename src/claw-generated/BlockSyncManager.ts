import { Chain } from './Chain';
import { Block } from './Block';
import { PeerManager } from '../networking/PeerManager';
import { ConnectionPool } from './ConnectionPool';

export class BlockSyncManager {
  private chain: Chain;
  private peerManager: PeerManager;
  private connectionPool: ConnectionPool;

  constructor(chain: Chain, peerManager: PeerManager, connectionPool: ConnectionPool) {
    this.chain = chain;
    this.peerManager: PeerManager = peerManager;
    this.connectionPool = connectionPool;
  }

  async syncBlocks(): Promise<void> {
    const localHeight = this.chain.getBlocks().length;
    const peers = this.peerManager.getConnectedPeers();

    const missingBlockHashes: string[] = [];
    for (const peer of peers) {
      try {
        const peerHeight = await peer.getBlockHeight();
        if (peerHeight > localHeight) {
          const peerMissingHashes = await this.getMissingBlockHashes(localHeight, peerHeight, peer);
          missingBlockHashes.push(...peerMissingHashes);
        }
      } catch (error) {
        console.error(`Error syncing with peer: ${error.message}`);
      }
    }

    const blocks = await this.downloadBlocks(missingBlockHashes, peers);
    for (const block of blocks) {
      if (await this.chain.validateBlock(block)) {
        this.chain.addBlock(block);
      } else {
        console.error(`Invalid block received: ${block.hash}`);
      }
    }
  }

  private async getMissingBlockHashes(
    localHeight: number,
    peerHeight: number,
    peer: any
  ): Promise<string[]> {
    // Implement logic to get the hashes of missing blocks
    return [`missing-block-hash-1`, `missing-block-hash-2`];
  }

  private async downloadBlocks(
    blockHashes: string[],
    peers: any[]
  ): Promise<Block[]> {
    // Download blocks in parallel from multiple peers
    const promises = blockHashes.map(async (hash) => {
      for (const peer of peers) {
        try {
          const block = await this.connectionPool.downloadBlock(hash, peer);
          if (block) {
            return block;
          }
        } catch (error) {
          console.error(`Error downloading block ${hash} from peer: ${error.message}`);
        }
      }
      return null;
    });

    const blocks = await Promise.all(promises);
    return blocks.filter(Boolean) as Block[];
  }
}