import { PeerID } from './types';

class BootstrapNode {
  id: PeerID;
  address: string;

  constructor(id: PeerID, address: string) {
    this.id = id;
    this.address = address;
  }
}

const DEFAULT_BOOTSTRAP_NODES: BootstrapNode[] = [
  new BootstrapNode('0x1234567890abcdef', 'bootstrap-node-1.example.com:8000'),
  new BootstrapNode('0x0987654321fedcba', 'bootstrap-node-2.example.com:8000')
];

export { BootstrapNode, DEFAULT_BOOTSTRAP_NODES };