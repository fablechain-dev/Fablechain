import { PeerInfo } from './PeerInfo';

export class PeerManager {
  private peers: Map<string, PeerInfo> = new Map();

  addPeer(peerInfo: PeerInfo) {
    this.peers.set(peerInfo.id, peerInfo);
  }

  removePeer(peerId: string) {
    this.peers.delete(peerId);
  }

  getPeer(peerId: string): PeerInfo | undefined {
    return this.peers.get(peerId);
  }

  getAllPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  banPeer(peerId: string, reason: string) {
    const peer = this.getPeer(peerId);
    if (peer) {
      peer.banned = true;
      peer.banReason = reason;
    }
  }

  unbanPeer(peerId: string) {
    const peer = this.getPeer(peerId);
    if (peer) {
      peer.banned = false;
      peer.banReason = '';
    }
  }
}