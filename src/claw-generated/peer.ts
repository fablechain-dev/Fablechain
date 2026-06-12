import { Transaction } from '../model/transaction';

export class Peer {
  sendTransaction(tx: Transaction): void {
    // TODO: Implement the actual network communication to send the transaction to this peer
    console.log(`Sending transaction ${tx.hash} to peer`);
  }
}