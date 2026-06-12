import { Transaction } from '../types';
import { PeerManager } from '../network/peer-manager';
import { MemPool } from '../mempool';

class TransactionGossipProtocol {
  private peerManager: PeerManager;
  private memPool: MemPool;
  private transactionCache: Set<string>;

  constructor(peerManager: PeerManager, memPool: MemPool) {
    this.peerManager = peerManager;
    this.memPool = memPool;
    this.transactionCache = new Set();
  }

  broadcastTransaction(tx: Transaction) {
    // Add the transaction to the mempool
    this.memPool.addTransaction(tx);

    // Check if the transaction has already been processed
    const txHash = tx.hash();
    if (this.transactionCache.has(txHash)) {
      return;
    }

    // Add the transaction hash to the cache
    this.transactionCache.add(txHash);

    // Broadcast the transaction to all connected peers
    this.peerManager.broadcastToAllPeers(tx);
  }

  handleTransactionFromPeer(tx: Transaction) {
    // Check if the transaction is already in the mempool
    if (this.memPool.hasTransaction(tx)) {
      return;
    }

    // Add the transaction to the mempool
    this.memPool.addTransaction(tx);

    // Broadcast the transaction to all other peers
    this.broadcastTransaction(tx);
  }
}

export { TransactionGossipProtocol };