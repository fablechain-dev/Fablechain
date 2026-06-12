export class Block {
  hash: string;
  prevHash: string;
  timestamp: number;
  data: any;

  constructor(prevHash: string, data: any) {
    this.prevHash = prevHash;
    this.data = data;
    this.timestamp = Date.now();
    this.hash = this.computeHash();
  }

  computeHash(): string {
    // Implement hash computation logic
    return 'placeholder';
  }
}