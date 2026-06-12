import { PeerDiscoveryProtocol } from './peer_discovery';
import { PeerInfo } from './types';

class NetworkManager {
  private peerDiscovery: PeerDiscoveryProtocol;

  constructor(bootstrapNodes: PeerInfo[]) {
    this.peerDiscovery = new PeerDiscoveryProtocol(bootstrapNodes);
  }

  async start() {
    await this.peerDiscovery.start();
    // Add other networking functionality here
  }
}

export { NetworkManager };