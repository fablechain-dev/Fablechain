import { Transaction } from '../core/Transaction';
import { Wallet } from '../core/Wallet';
import { BlockChain } from '../core/BlockChain';

export class StateChannel {
  private participants: Wallet[];
  private transactions: Transaction[];
  private isOpen: boolean;
  private initialFunding: number;
  private blockchain: BlockChain;

  constructor(participants: Wallet[], blockchain: BlockChain) {
    this.participants = participants;
    this.transactions = [];
    this.isOpen = false;
    this.initialFunding = 0;
    this.blockchain = blockchain;
  }

  open(initialFunding: number) {
    this.isOpen = true;
    this.initialFunding = initialFunding;
    // Lock initial funding in the main chain
    this.blockchain.lockFunds(this.participants, initialFunding);
  }

  close() {
    this.isOpen = false;
    // Commit final state to main chain
    this.blockchain.commitChannelState(this.transactions);
    // Unlock funds
    this.blockchain.unlockFunds(this.participants, this.initialFunding);
  }

  addTransaction(tx: Transaction) {
    if (!this.isOpen) {
      throw new Error('Channel is closed');
    }
    this.transactions.push(tx);
  }

  getState(): Transaction[] {
    return this.transactions;
  }
}