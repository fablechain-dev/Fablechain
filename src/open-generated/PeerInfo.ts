export class PeerInfo {
  id: string;
  address: string;
  lastSeen: number;
  reputation: number;
  banned: boolean;
  banReason: string;

  constructor(id: string, address: string) {
    this.id = id;
    this.address = address;
    this.lastSeen = Date.now();
    this.reputation = 100;
    this.banned = false;
    this.banReason = '';
  }

  updateLastSeen() {
    this.lastSeen = Date.now();
  }

  increaseReputation(amount: number) {
    this.reputation = Math.min(this.reputation + amount, 100);
  }

  decreaseReputation(amount: number) {
    this.reputation = Math.max(this.reputation - amount, 0);
  }
}