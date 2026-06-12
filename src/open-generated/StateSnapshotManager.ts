import { Block } from './Block';
import { StateManager } from './StateManager';
import { CompressionAlgorithm, CompressedSnapshot, Snapshot } from './StateSnapshot';

class StateSnapshotManager {
  private snapshotInterval: number;
  private compressionAlgorithm: CompressionAlgorithm;
  private snapshotStorage: SnapshotStorage;

  constructor(
    snapshotInterval: number,
    compressionAlgorithm: CompressionAlgorithm,
    snapshotStorage: SnapshotStorage
  ) {
    this.snapshotInterval = snapshotInterval;
    this.compressionAlgorithm = compressionAlgorithm;
    this.snapshotStorage = snapshotStorage;
  }

  async createSnapshot(block: Block): Promise<CompressedSnapshot> {
    const state = await StateManager.getState(block);
    const snapshot: Snapshot = {
      blockNumber: block.number,
      state,
    };
    const compressedSnapshot = await this.compressSnapshot(snapshot);
    await this.storeSnapshot(compressedSnapshot);
    return compressedSnapshot;
  }

  private async compressSnapshot(snapshot: Snapshot): Promise<CompressedSnapshot> {
    const compressed = await this.compressionAlgorithm.compress(JSON.stringify(snapshot));
    return {
      blockNumber: snapshot.blockNumber,
      compressed,
    };
  }

  private async storeSnapshot(snapshot: CompressedSnapshot): Promise<void> {
    await this.snapshotStorage.storeSnapshot(snapshot);
  }

  async getSnapshot(blockNumber: number): Promise<Snapshot | null> {
    const compressedSnapshot = await this.snapshotStorage.getSnapshot(blockNumber);
    if (!compressedSnapshot) {
      return null;
    }
    const snapshot = JSON.parse(await this.compressionAlgorithm.decompress(compressedSnapshot.compressed));
    return snapshot;
  }
}

export { StateSnapshotManager };