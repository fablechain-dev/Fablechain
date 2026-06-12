import { PeerInfo } from './types';

class PeerManager {
  private peers: Map<string, PeerInfo> = new Map();
  private reputationThreshold: number = 50;

  addPeer(peerInfo: PeerInfo): void {
    this.peers.set(peerInfo.id, { ...peerInfo, reputation: 100 });
  }

  removePeer(peerId: string): void {
    this.peers.delete(peerId);
  }

  updatePeerReputation(peerId: string, delta: number): void {
    const peerInfo = this.peers.get(peerId);
    if (peerInfo) {
      peerInfo.reputation = Math.max(0, peerInfo.reputation + delta);
      if (peerInfo.reputation < this.reputationThreshold) {
        this.removePeer(peerId);
      }
    }
  }

  getBestPeers(maxPeers: number): PeerInfo[] {
    return Array.from(this.peers.values())
      .sort((a, b) => b.reputation - a.reputation)
      .slice(0, maxPeers);
  }
}

export default PeerManager;