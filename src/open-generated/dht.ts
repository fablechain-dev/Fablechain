import { Node, RoutingTable } from './types';

class KademliaDHT {
  private routingTable: RoutingTable;
  private bootstrapNodes: Node[];

  constructor(bootstrapNodes: Node[]) {
    this.routingTable = new RoutingTable();
    this.bootstrapNodes = bootstrapNodes;
  }

  async joinNetwork() {
    // Connect to bootstrap nodes and populate routing table
    for (const node of this.bootstrapNodes) {
      await this.routingTable.addNode(node);
    }

    // Perform a Kademlia-style lookup to discover more nodes
    const myNodeId = this.routingTable.getLocalNodeId();
    const closestNodes = await this.findNode(myNodeId);
    for (const node of closestNodes) {
      await this.routingTable.addNode(node);
    }
  }

  async findNode(targetId: string): Promise<Node[]> {
    // Perform a Kademlia-style node lookup
    const closestNodes = await this.routingTable.findClosestNodes(targetId);
    const furtherNodes = await this.requestCloserNodes(closestNodes, targetId);
    return [...closestNodes, ...furtherNodes];
  }

  private async requestCloserNodes(nodes: Node[], targetId: string): Promise<Node[]> {
    // Recursively request closer nodes from the current set
    const furtherNodes = [];
    for (const node of nodes) {
      const closerNodes = await node.findCloserNodes(targetId);
      furtherNodes.push(...closerNodes);
    }
    return furtherNodes;
  }

  async store(key: string, value: any): Promise<void> {
    // Store a key-value pair in the DHT
    await this.routingTable.storeKeyValue(key, value);
  }

  async retrieve(key: string): Promise<any> {
    // Retrieve a value from the DHT
    const value = await this.routingTable.retrieveValue(key);
    return value;
  }
}

export { KademliaDHT };