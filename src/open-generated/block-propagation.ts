import { Block } from '../blockchain/block';
import { Peer } from './peer';

export class BlockPropagation {
  private peers: Peer[];

  constructor(peers: Peer[]) {
    this.peers = peers;
  }

  broadcastBlockAnnouncement(block: Block) {
    // Send a "block announcement" message to all peers
    this.peers.forEach(peer => {
      peer.sendBlockAnnouncement(block.header, block.id);
    });
  }

  handleBlockRequest(peerId: string, blockId: string) {
    // Find the peer that requested the block
    const peer = this.peers.find(p => p.id === peerId);
    if (!peer) {
      return;
    }

    // Retrieve the full block and send a compact representation
    const block = this.getBlockByID(blockId);
    peer.sendCompactBlock(block);
  }

  propagateBlock(block: Block) {
    // Broadcast the full block to all connected peers
    this.peers.forEach(peer => {
      peer.sendFullBlock(block);
    });
  }

  private getBlockByID(blockId: string): Block {
    // Implement logic to retrieve a block by its ID
    // (e.g., from the blockchain storage)
    return new Block();
  }
}