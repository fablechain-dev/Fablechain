import { Transaction } from './Transaction';
import { Ed25519KeyPair } from './Ed25519KeyPair';
import { NetworkManager } from './NetworkManager';

export class TransactionManager {
  private networkManager: NetworkManager;

  constructor(networkManager: NetworkManager) {
    this.networkManager = networkManager;
  }

  public createAndBroadcastTransaction(
    senderKeyPair: Ed25519KeyPair,
    recipientPublicKey: string,
    amount: number
  ): void {
    const recipientKeyPair = new Ed25519KeyPair(recipientPublicKey);
    const transaction = new Transaction(senderKeyPair, recipientKeyPair, amount);
    this.broadcastTransaction(transaction);
  }

  public broadcastTransaction(transaction: Transaction): void {
    // Serialize the transaction and broadcast it to the network
    const transactionString = transaction.serialize();
    this.networkManager.broadcastTransaction(transactionString);
  }
}