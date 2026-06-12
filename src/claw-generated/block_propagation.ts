import { Block } from './blockchain/block';
import { Peer } from './networking/peer';
import { CompactBlock } from './networking/compact_block';
import { BlockManager } from './blockchain/BlockManager';

export class BlockPropagation {
  private peers: Peer[] = [];
  private blockManager: BlockManager;

  constructor(blockManager: BlockManager) {
    this.blockManager = blockManager;
  }

  addPeer(peer: Peer) {
    this.peers.push(peer);
  }

  start() {
    this.blockManager.onNewBlock((block: Block) => {
      this.broadcastBlock(block);
    });
  }

  broadcastBlock(block: Block) {
    const compactBlock = new CompactBlock(block);
    for (const peer of this.peers) {
      peer.sendCompactBlock(compactBlock);
    }
  }
}