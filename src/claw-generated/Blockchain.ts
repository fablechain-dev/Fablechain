import { Block } from './Block';
import { CheckpointManager } from './CheckpointManager';

export class Blockchain {
  private blocks: Block[] = [];
  private checkpointManager: CheckpointManager = new CheckpointManager();

  addBlock(block: Block): void {
    this.blocks.push(block);
    this.checkpointManager.addCheckpoint(block);
  }

  getBlockByNumber(number: number): Block | null {
    const checkpoint = this.checkpointManager.getCheckpointForBlock(number);
    if (checkpoint) {
      // If the block is before the checkpoint, skip verification
      return new Block(number, checkpoint.block.hash, checkpoint.block.timestamp);
    }
    // Otherwise, verify the block as usual
    return this.blocks.find((b) => b.number === number) || null;
  }
}