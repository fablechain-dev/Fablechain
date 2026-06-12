import { Transaction } from '../core/transaction';
import { Peer } from '../networking/peer';
import { MempoolManager } from '../mempool/mempool_manager';

class TransactionGossipProtocol {
  private broadcastedTransactions: Set<string> = new Set();
  private mempoolManager: MempoolManager;

  constructor(mempoolManager: MempoolManager) {
    this.mempoolManager = mempoolManager;
  }

  handleNewTransaction(transaction: Transaction, fromPeer: Peer) {
    // Add transaction to mempool
    this.mempoolManager.addTransaction(transaction);

    // Broadcast transaction to peers, except the one that sent it
    this.broadcastTransaction(transaction, fromPeer);
  }

  broadcastTransaction(transaction: Transaction, excludePeer: Peer) {
    // Check if transaction has already been broadcast
    const txHash = transaction.hash();
    if (this.broadcastedTransactions.has(txHash)) {
      return;
    }

    // Add transaction to broadcast set
    this.broadcastedTransactions.add(txHash);

    // Broadcast transaction to all peers, except the one that sent it
    for (const peer of this.mempoolManager.getPeers()) {
      if (peer !== excludePeer) {
        peer.sendTransaction(transaction);
      }
    }
  }
}

export { TransactionGossipProtocol };