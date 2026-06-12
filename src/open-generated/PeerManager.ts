import { Peer } from './Peer';

export class PeerManager {
  private peers: Map<string, Peer> = new Map();

  addPeer(peer: Peer) {
    this.peers.set(peer.id, peer);
  }

  removePeer(peerId: string) {
    this.peers.delete(peerId);
  }

  getBestPeers(count: number): Peer[] {
    // Sort peers by reputation and return the top `count` peers
    return Array.from(this.peers.values())
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, count);
  }

  banPeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.updateReputation(-100);
    }
  }
}