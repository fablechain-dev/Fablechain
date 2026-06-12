import { Peer } from './peer';
import { PeerManager } from './peer_manager';
import { Block } from '../blockchain/block';

export class BlockPropagator {
  private peerManager: PeerManager;

  constructor(peerManager: PeerManager) {
    this.peerManager = peerManager;
  }

  broadcastBlock(block: Block) {
    const peers = this.peerManager.getPeers();
    for (const peer of peers) {
      this.sendBlockToPeer(peer, block);
    }
  }

  private sendBlockToPeer(peer: Peer, block: Block) {
    // Implement compact block relay logic to send only the necessary block data
  }
}