import { Peer } from './peer_connection';
import { TransactionGossipProtocol } from './transaction-gossip-protocol';
import { TransactionMempool } from '../transaction_mempool';

class PeerManager {
  private peers: Peer[] = [];
  private transactionGossipProtocol: TransactionGossipProtocol;

  constructor(mempool: TransactionMempool) {
    this.transactionGossipProtocol = new TransactionGossipProtocol(mempool);
  }

  addPeer(peer: Peer): void {
    this.peers.push(peer);
    this.transactionGossipProtocol.addPeer(peer);
  }

  removePeer(peer: Peer): void {
    this.peers = this.peers.filter(p => p !== peer);
    this.transactionGossipProtocol.removePeer(peer);
  }

  // Other peer management methods...
}

export { PeerManager };