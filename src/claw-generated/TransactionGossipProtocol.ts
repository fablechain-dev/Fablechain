import { Transaction } from '../blockchain/Transaction';
import { TransactionMempool } from './TransactionMempool';
import { PeerManager } from '../networking/PeerManager';

export class TransactionGossipProtocol {
  private mempool: TransactionMempool;
  private peerManager: PeerManager;

  constructor(mempool: TransactionMempool, peerManager: PeerManager) {
    this.mempool = mempool;
    this.peerManager = peerManager;
  }

  broadcastTransaction(tx: Transaction): void {
    // Add transaction to mempool
    this.mempool.addTransaction(tx);

    // Broadcast transaction to peers
    this.peerManager.broadcastTransaction(tx);
  }

  handleTransactionFromPeer(tx: Transaction): void {
    // Check if transaction is already in mempool
    if (this.mempool.getTransactions().some(t => t.id === tx.id)) {
      return;
    }

    // Add transaction to mempool
    this.mempool.addTransaction(tx);

    // Broadcast transaction to other peers
    this.peerManager.broadcastTransaction(tx);
  }
}