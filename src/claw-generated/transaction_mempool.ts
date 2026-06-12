import { Transaction } from './transaction';
import { PeerManager } from './networking/peer_manager';
import { TransactionGossipProtocol } from './networking/transaction-gossip-protocol';

class TransactionMempool {
  private transactions: Map<string, Transaction>;
  private peerManager: PeerManager;
  private transactionGossipProtocol: TransactionGossipProtocol;

  constructor(peerManager: PeerManager) {
    this.transactions = new Map();
    this.peerManager = peerManager;
    this.transactionGossipProtocol = peerManager.transactionGossipProtocol;
  }

  addTransaction(tx: Transaction): void {
    const txHash = tx.hash();
    if (!this.transactions.has(txHash)) {
      this.transactions.set(txHash, tx);
      this.transactionGossipProtocol.broadcastTransaction(tx);
    }
  }

  // Other mempool methods...
}

export { TransactionMempool };