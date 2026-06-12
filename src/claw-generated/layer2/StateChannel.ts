import { Transaction } from '../core/Transaction';
import { Wallet } from '../core/Wallet';

export class StateChannel {
  private participants: Wallet[];
  private transactions: Transaction[];
  private isOpen: boolean;

  constructor(participants: Wallet[]) {
    this.participants = participants;
    this.transactions = [];
    this.isOpen = false;
  }

  open() {
    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
    // Commit final state to main chain
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