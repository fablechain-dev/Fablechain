import { KademliaNode, KademliaRoutingTable } from './kademlia';
import { PeerInfo } from './types';

class PeerDiscoveryProtocol {
  private routingTable: KademliaRoutingTable;
  private bootstrapNodes: PeerInfo[];

  constructor(bootstrapNodes: PeerInfo[]) {
    this.routingTable = new KademliaRoutingTable();
    this.bootstrapNodes = bootstrapNodes;
  }

  async start() {
    // Connect to bootstrap nodes and populate the routing table
    await this.connectToBootstrapNodes();

    // Start periodically refreshing the routing table
    setInterval(() => this.refreshRoutingTable(), 60000);
  }

  private async connectToBootstrapNodes() {
    for (const node of this.bootstrapNodes) {
      const kademliaNode = new KademliaNode(node);
      await kademliaNode.connect();
      this.routingTable.addNode(kademliaNode);
    }
  }

  private async refreshRoutingTable() {
    // Periodically query the routing table and connect to new nodes
  }
}

export { PeerDiscoveryProtocol };