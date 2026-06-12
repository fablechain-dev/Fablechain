import { Peer } from './peer';
import { PeerInfo, NetworkMessage } from './types';

export class Network {
  peers: Map<string, Peer> = new Map();

  addPeer(peerInfo: PeerInfo) {
    const peer = new Peer(peerInfo);
    this.peers.set(peerInfo.id, peer);
  }

  removePeer(peerId: string) {
    this.peers.delete(peerId);
  }

  handleMessage(message: NetworkMessage, peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      return;
    }

    // Evaluate the message and update the peer's reputation accordingly
    if (this.isValidMessage(message)) {
      peer.updateReputation(5); // Increase reputation for valid messages
    } else {
      peer.updateReputation(-10); // Decrease reputation for invalid messages
    }

    if (peer.isBanned()) {
      this.removePeer(peerId); // Ban the peer if their reputation is 0
    }
  }

  private isValidMessage(message: NetworkMessage): boolean {
    // Implement logic to validate the message
    return true;
  }
}