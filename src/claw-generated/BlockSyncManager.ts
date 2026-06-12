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
    this.peerManager = peerManager;
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

    const blocks = await this.downloadBlocksInParallel(missingBlockHashes, peers);
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
    const missingHashes = [];
    for (let i = localHeight + 1; i <= peerHeight; i++) {
      try {
        const blockHash = await peer.getBlockHash(i);
        if (!this.chain.hasBlock(blockHash)) {
          missingHashes.push(blockHash);
        }
      } catch (error) {
        console.error(`Error getting block hash ${i} from peer: ${error.message}`);
      }
    }
    return missingHashes;
  }

  private async downloadBlocksInParallel(
    blockHashes: string[],
    peers: any[]
  ): Promise<Block[]> {
    const promises = blockHashes.map(async (hash) => {
      const blocks = await Promise.all(
        peers.map(async (peer) => {
          try {
            const block = await this.connectionPool.downloadBlock(hash, peer);
            if (block) {
              return block;
            }
          } catch (error) {
            console.error(`Error downloading block ${hash} from peer: ${error.message}`);
          }
          return null;
        })
      );
      return blocks.find(Boolean) || null;
    });

    const blocks = await Promise.all(promises);
    return blocks.filter(Boolean) as Block[];
  }
}