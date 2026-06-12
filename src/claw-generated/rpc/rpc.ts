import { PeerManager } from '../networking/peer_manager';
import { TransactionGossipProtocol } from '../networking/transaction-gossip-protocol';

class RPCServer {
  private peerManager: PeerManager;
  private transactionGossipProtocol: TransactionGossipProtocol;

  constructor(peerManager: PeerManager) {
    this.peerManager = peerManager;
    this.transactionGossipProtocol = peerManager.transactionGossipProtocol;
  }

  handleTransactionRequest(peer: Peer, txHash: string): void {
    this.transactionGossipProtocol.handleTransactionRequest(peer, txHash);
  }

  // Other RPC methods...
}

export { RPCServer };