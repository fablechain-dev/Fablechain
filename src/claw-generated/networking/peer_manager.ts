import { Peer } from './peer';
import { TransactionGossipProtocol } from './transaction_gossip_protocol';
import { MempoolManager } from '../mempool/mempool_manager';
import { Transaction } from '../core/transaction';

class PeerManager {
  private peers: Peer[] = [];
  private transactionGossipProtocol: TransactionGossipProtocol;

  constructor(mempoolManager: MempoolManager) {
    this.transactionGossipProtocol = new TransactionGossipProtocol(mempoolManager);
  }

  addPeer(peer: Peer) {
    this.peers.push(peer);
  }

  removePeer(peer: Peer) {
    this.peers = this.peers.filter(p => p !== peer);
  }

  getPeers() {
    return this.peers;
  }

  handleNewTransaction(transaction: Transaction, fromPeer: Peer) {
    this.transactionGossipProtocol.handleNewTransaction(transaction, fromPeer);
  }
}

export { PeerManager };