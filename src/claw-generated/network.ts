import { Peer } from './peer';
import { Block } from '../blockchain/block';
import { Transaction } from '../blockchain/transaction';

export class Network {
  private peers: Peer[] = [];
  private maxPeers = 50;

  addPeer(address: string) {
    // Check if peer already exists
    const existingPeer = this.peers.find(p => p.address === address);
    if (existingPeer) {
      existingPeer.updateLastSeen();
      return;
    }

    // Add new peer
    if (this.peers.length < this.maxPeers) {
      const newPeer = new Peer(address);
      this.peers.push(newPeer);
    }
  }

  removePeer(address: string) {
    this.peers = this.peers.filter(p => p.address !== address);
  }

  getPeers(): Peer[] {
    return this.peers;
  }

  handleIncomingBlock(block: Block) {
    // Validate the block
    // If valid, update peer reputations
    this.peers.forEach(peer => {
      if (peer.address === block.miner) {
        peer.increaseReputation(10);
      } else {
        peer.decreaseReputation(5);
      }
    });
  }

  handleIncomingTransaction(tx: Transaction) {
    // Validate the transaction
    // If valid, update peer reputations
    this.peers.forEach(peer => {
      if (peer.address === tx.sender || peer.address === tx.recipient) {
        peer.increaseReputation(2);
      } else {
        peer.decreaseReputation(1);
      }
    });
  }
}