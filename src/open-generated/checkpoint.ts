import { Block } from '../core/block';

export class Checkpoint {
  public blockNumber: number;
  public blockHash: string;
  public timestamp: number;

  constructor(block: Block) {
    this.blockNumber = block.number;
    this.blockHash = block.hash;
    this.timestamp = block.timestamp;
  }
}

export class CheckpointManager {
  private checkpoints: Checkpoint[] = [];
  private checkpointInterval = 10000; // Checkpoint every 10,000 blocks

  addCheckpoint(block: Block) {
    if (block.number % this.checkpointInterval === 0) {
      this.checkpoints.push(new Checkpoint(block));
    }
  }

  getCheckpointByNumber(blockNumber: number): Checkpoint | undefined {
    return this.checkpoints.find(cp => cp.blockNumber <= blockNumber);
  }
}