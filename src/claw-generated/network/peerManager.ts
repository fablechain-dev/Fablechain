import Peer from './peer';
import { PeerInfo } from './types';

class PeerManager {
  peers: Map<string, Peer>;
  banList: Set<string>;

  constructor() {
    this.peers = new Map();
    this.banList = new Set();
  }

  addPeer(peerInfo: PeerInfo): Peer {
    const key = this.getPeerKey(peerInfo);
    if (this.banList.has(key)) {
      return null;
    }
    let peer = this.peers.get(key);
    if (!peer) {
      peer = new Peer(peerInfo);
      this.peers.set(key, peer);
    }
    return peer;
  }

  getPeerKey(peerInfo: PeerInfo): string {
    return `${peerInfo.address}:${peerInfo.port}`;
  }

  banPeer(peerInfo: PeerInfo): void {
    const key = this.getPeerKey(peerInfo);
    this.banList.add(key);
    this.peers.delete(key);
  }

  updatePeerReputation(peerInfo: PeerInfo, delta: number): void {
    const peer = this.peers.get(this.getPeerKey(peerInfo));
    if (peer) {
      peer.updateReputation(delta);
      if (peer.isMisbehaving()) {
        this.banPeer(peerInfo);
      }
    }
  }

  getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }
}

export default PeerManager;