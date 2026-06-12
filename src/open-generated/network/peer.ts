import { PeerInfo } from './types';

class Peer {
  info: PeerInfo;
  reputation: number;

  constructor(info: PeerInfo) {
    this.info = info;
    this.reputation = 100; // start with a neutral reputation
  }

  updateReputation(delta: number) {
    this.reputation = Math.max(0, this.reputation + delta);
  }

  isMisbehaving(): boolean {
    return this.reputation < 50;
  }
}

export default Peer;