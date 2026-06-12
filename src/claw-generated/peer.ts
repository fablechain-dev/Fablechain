import { Block } from '../blockchain/block';
import { Transaction } from '../blockchain/transaction';

export class Peer {
  public address: string;
  public lastSeen: number;
  public reputation: number;

  constructor(address: string) {
    this.address = address;
    this.lastSeen = Date.now();
    this.reputation = 100; // Start with full reputation
  }

  updateLastSeen() {
    this.lastSeen = Date.now();
  }

  decreaseReputation(amount: number) {
    this.reputation = Math.max(0, this.reputation - amount);
  }

  increaseReputation(amount: number) {
    this.reputation = Math.min(100, this.reputation + amount);
  }

  isReliable(): boolean {
    return this.reputation >= 80;
  }

  isMisbehaving(): boolean {
    return this.reputation <= 20;
  }
}