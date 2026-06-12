import { Network } from './network';
import { PeerInfo } from './types';

export class Networking {
  network: Network;

  constructor() {
    this.network = new Network();
  }

  connectToPeer(peerInfo: PeerInfo) {
    // Check if the peer is already connected
    if (this.network.peers.has(peerInfo.id)) {
      return;
    }

    // Check the peer's reputation before connecting
    if (this.network.peers.has(peerInfo.id)) {
      const peer = this.network.peers.get(peerInfo.id)!;
      if (peer.isBanned()) {
        console.log(`Refusing to connect to banned peer: ${peerInfo.id}`);
        return;
      }
    }

    // Connect to the peer and add them to the network
    this.network.addPeer(peerInfo);
    console.log(`Connected to peer: ${peerInfo.id}`);
  }

  disconnectFromPeer(peerId: string) {
    this.network.removePeer(peerId);
    console.log(`Disconnected from peer: ${peerId}`);
  }

  sendMessage(message: any, peerId: string) {
    const peer = this.network.peers.get(peerId);
    if (peer) {
      this.network.handleMessage(message, peerId);
    } else {
      console.log(`Peer not found: ${peerId}`);
    }
  }
}