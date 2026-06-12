import { Kademlia } from './kademlia';
import { BootstrapNode } from './bootstrap_node';

class PeerDiscovery {
  private kademlia: Kademlia;
  private bootstrapNodes: BootstrapNode[];

  constructor(bootstrapNodes: BootstrapNode[]) {
    this.bootstrapNodes = bootstrapNodes;
    this.kademlia = new Kademlia();
  }

  async start() {
    // Connect to bootstrap nodes
    await this.connectToBootstrapNodes();

    // Start Kademlia DHT
    await this.kademlia.start();
  }

  private async connectToBootstrapNodes() {
    for (const node of this.bootstrapNodes) {
      await this.kademlia.connectToNode(node);
    }
  }
}

export { PeerDiscovery };