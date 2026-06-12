import { Peer } from './peer';
import { TransactionBroadcaster } from './transaction-broadcaster';
import { Transaction } from '../model/transaction';

export class NetworkManager {
  private peers: Peer[] = [];
  private transactionBroadcaster: TransactionBroadcaster;

  constructor() {
    this.transactionBroadcaster = new TransactionBroadcaster(this.peers);
  }

  addPeer(peer: Peer): void {
    this.peers.push(peer);
    this.transactionBroadcaster.peers.push(peer);
  }

  removePeer(peer: Peer): void {
    this.peers = this.peers.filter(p => p !== peer);
    this.transactionBroadcaster.peers = this.transactionBroadcaster.peers.filter(p => p !== peer);
  }

  broadcastTransaction(tx: Transaction): void {
    this.transactionBroadcaster.broadcastTransaction(tx);
  }
}