import { PeerInfo } from './types';

export class Peer {
  info: PeerInfo;
  reputation: number;

  constructor(info: PeerInfo) {
    this.info = info;
    this.reputation = 100; // start with a neutral reputation
  }

  updateReputation(delta: number) {
    this.reputation = Math.max(0, Math.min(100, this.reputation + delta));
  }

  isBanned(): boolean {
    return this.reputation === 0;
  }
}