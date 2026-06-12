import { Peer } from './peer';
import { Chain } from './chain';

export class BlockSync {
  private chain: Chain;
  private peers: Peer[];

  constructor(chain: Chain, peers: Peer[]) {
    this.chain = chain;
    this.peers = peers;
  }

  async syncBlocks() {
    // 1. Fetch block heights from peers
    const peerHeights = await this.getPeerBlockHeights();

    // 2. Determine missing blocks
    const localHeight = this.chain.getHeight();
    const missingBlocks = this.getMissingBlocks(peerHeights, localHeight);

    // 3. Request missing blocks in parallel
    await this.downloadMissingBlocks(missingBlocks);

    // 4. Integrate downloaded blocks
    await this.chain.addBlocks(missingBlocks);
  }

  private async getPeerBlockHeights(): Promise<Map<Peer, number>> {
    // Fetch block heights from all connected peers
    // Return a map of peer -> block height
  }

  private getMissingBlocks(peerHeights: Map<Peer, number>, localHeight: number): number[] {
    // Determine which block numbers are missing from the local chain
    // Return an array of block numbers to fetch
  }

  private async downloadMissingBlocks(blockNumbers: number[]) {
    // Request missing blocks from peers in parallel
    // Validate and store the downloaded blocks
  }
}