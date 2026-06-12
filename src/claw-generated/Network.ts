import { PeerManager } from './PeerManager';
import { Peer } from './Peer';

export class Network {
  private peerManager: PeerManager;

  constructor() {
    this.peerManager = new PeerManager();
  }

  connectToPeer(address: string) {
    const peer = new Peer(address, address);
    this.peerManager.addPeer(peer);
    // Connect to the peer and establish a connection
  }

  broadcastTransaction(transaction: any) {
    // Broadcast the transaction to all connected peers
    for (const peer of this.peerManager.getBestPeers(10)) {
      peer.connection.sendTransaction(transaction);
    }
  }
}