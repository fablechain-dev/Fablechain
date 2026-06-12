import { BlockManagerExtension } from './BlockManagerExtension';
import { Peer } from './Peer';

export class NetworkManager {
  private blockManager: BlockManagerExtension;
  private peers: Peer[] = [];

  requestMissingBlocks() {
    const missingBlockIds = this.blockManager.detectMissingBlocks();
    if (missingBlockIds.length === 0) {
      return;
    }

    // Query peers for the missing blocks
    const blocks = await this.downloadBlocksInParallel(missingBlockIds);

    // Validate and store the downloaded blocks
    for (const block of blocks) {
      this.blockManager.storeBlock(block);
    }
  }

  private async downloadBlocksInParallel(blockIds: number[]) {
    const promises = blockIds.map(async (blockId) => {
      const peer = this.getRandomPeer();
      const blockData = await peer.getBlock(blockId);
      const block = Block.fromData(blockData);
      if (await this.blockManager.validateBlock(block)) {
        return block;
      } else {
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean) as Block[];
  }

  private getRandomPeer(): Peer {
    // TODO: Implement peer selection logic
    return this.peers[0];
  }
}