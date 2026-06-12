import { Block } from '../blockchain/block';
import { Peer } from './peer';
import { CompactBlock } from './compact_block';

export class BlockPropagation {
  private peers: Peer[] = [];

  addPeer(peer: Peer) {
    this.peers.push(peer);
  }

  broadcastBlock(block: Block) {
    const compactBlock = new CompactBlock(block);
    for (const peer of this.peers) {
      peer.sendCompactBlock(compactBlock);
    }
  }
}