import { Peer } from './peer';

export class PeerManager {
  private peers: Map<string, Peer> = new Map();

  addPeer(peer: Peer) {
    this.peers.set(peer.id, peer);
  }

  removePeer(peerId: string) {
    this.peers.delete(peerId);
  }

  getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }
}