import { Transaction } from '../model/transaction';
import { Peer } from './peer';

export class TransactionBroadcaster {
  private knownTransactions: Set<string> = new Set();

  constructor(private peers: Peer[]) {}

  broadcastTransaction(tx: Transaction): void {
    // Check if we've already seen this transaction
    if (this.knownTransactions.has(tx.hash)) {
      return;
    }

    // Add the transaction to the known set
    this.knownTransactions.add(tx.hash);

    // Broadcast the transaction to all peers
    for (const peer of this.peers) {
      peer.sendTransaction(tx);
    }
  }
}