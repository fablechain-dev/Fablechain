import { Peer } from './peer';
import { BlockPropagation } from '../block_propagation';
import { BlockManager } from '../blockchain/BlockManager';

export class PeerManager {
  private peers: Peer[] = [];
  private blockPropagation: BlockPropagation;

  constructor(blockManager: BlockManager) {
    this.blockPropagation = new BlockPropagation(blockManager);
  }

  addPeer(peer: Peer) {
    this.peers.push(peer);
    this.blockPropagation.addPeer(peer);
  }

  removePeer(peer: Peer) {
    this.peers = this.peers.filter(p => p !== peer);
    this.blockPropagation.addPeer(peer);
  }

  start() {
    this.blockPropagation.start();
  }
}