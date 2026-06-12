import PeerManager from './PeerManager';
import { PeerInfo } from './types';

class NetworkManager {
  private peerManager: PeerManager = new PeerManager();

  addPeer(peerInfo: PeerInfo): void {
    this.peerManager.addPeer(peerInfo);
  }

  removePeer(peerId: string): void {
    this.peerManager.removePeer(peerId);
  }

  updatePeerReputation(peerId: string, delta: number): void {
    this.peerManager.updatePeerReputation(peerId, delta);
  }

  getBestPeers(maxPeers: number): PeerInfo[] {
    return this.peerManager.getBestPeers(maxPeers);
  }

  // Other network management methods...
}

export default NetworkManager;