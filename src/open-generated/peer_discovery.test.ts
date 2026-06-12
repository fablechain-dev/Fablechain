import { PeerDiscovery } from './peer_discovery';
import { BootstrapNode } from './bootstrap_nodes';
import { KademliaNode } from './kademlia';

describe('PeerDiscovery', () => {
  test('should connect to bootstrap nodes and populate routing table', async () => {
    const bootstrapNodes: BootstrapNode[] = [
      new BootstrapNode('0x1234567890abcdef', 'bootstrap-node-1.example.com:8000'),
      new BootstrapNode('0x0987654321fedcba', 'bootstrap-node-2.example.com:8000')
    ];

    const peerDiscovery = new PeerDiscovery('0x1234567890abcdef1234', bootstrapNodes);
    await peerDiscovery.joinNetwork();

    const closestNodes = peerDiscovery.findClosestNodes('0x0987654321fedcba', 2);
    expect(closestNodes.length).toBe(2);
    expect(closestNodes[0]).toBeInstanceOf(KademliaNode);
  });
});