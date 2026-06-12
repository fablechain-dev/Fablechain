import { Connection } from './Connection';

export class Peer {
  public id: string;
  public address: string;
  public connection: Connection;
  public reputation: number;
  private lastResponseTime: number;

  constructor(id: string, address: string) {
    this.id = id;
    this.address = address;
    this.reputation = 100; // Start with a neutral reputation
    this.lastResponseTime = 0;
  }

  updateReputation(delta: number) {
    this.reputation += delta;
    this.reputation = Math.max(0, this.reputation); // Ensure reputation doesn't go below 0
  }

  updateResponseTime(responseTime: number) {
    this.lastResponseTime = responseTime;
    this.updateReputation(-(responseTime - 100)); // Penalize slow response times
  }

  isBanned(): boolean {
    return this.reputation <= 0;
  }
}