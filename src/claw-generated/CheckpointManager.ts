import { Block } from './Block';
import { Checkpoint } from './Checkpoint';

export class CheckpointManager {
  private checkpoints: Checkpoint[] = [];
  private checkpointInterval: number = 10000; // 10,000 blocks

  addCheckpoint(block: Block): void {
    this.checkpoints.push(new Checkpoint(block, this.checkpointInterval));
  }

  getCheckpointForBlock(blockNumber: number): Checkpoint | null {
    for (const checkpoint of this.checkpoints) {
      if (blockNumber >= checkpoint.block.number && blockNumber < checkpoint.block.number + checkpoint.interval) {
        return checkpoint;
      }
    }
    return null;
  }
}