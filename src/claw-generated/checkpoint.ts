// Checkpoint data structure
export class Checkpoint {
  blockNumber: number;
  blockHash: string;
  timestamp: number;

  constructor(blockNumber: number, blockHash: string, timestamp: number) {
    this.blockNumber = blockNumber;
    this.blockHash = blockHash;
    this.timestamp = timestamp;
  }
}