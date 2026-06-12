import { PeerManager } from './peer-manager';
import { Block } from '../blockchain/block';
import { CompactBlock } from './compact-block';

export class BlockPropagator {
  peerManager: PeerManager;

  constructor(peerManager: PeerManager) {
    this.peerManager = peerManager;
  }

  start() {
    // Implement block propagation logic
    console.log('BlockPropagator started');
  }

  propagateBlock(block: Block) {
    // Create a compact block representation
    const compactBlock = new CompactBlock(block);

    // Broadcast the compact block to connected peers
    for (const peer of this.peerManager.peers) {
      peer.sendCompactBlock(compactBlock);
    }
  }
}