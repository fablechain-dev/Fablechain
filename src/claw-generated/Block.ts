export class Block {
  number: number;
  hash: string;
  timestamp: number;

  constructor(number: number, hash: string, timestamp: number) {
    this.number = number;
    this.hash = hash;
    this.timestamp = timestamp;
  }
}