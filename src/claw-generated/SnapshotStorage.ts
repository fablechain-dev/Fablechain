import { CompressedSnapshot } from './StateSnapshot';

class FileSystemSnapshotStorage implements SnapshotStorage {
  private snapshotDir: string;

  constructor(snapshotDir: string) {
    this.snapshotDir = snapshotDir;
  }

  async storeSnapshot(snapshot: CompressedSnapshot): Promise<void> {
    // Save the compressed snapshot to the file system
    const filePath = `${this.snapshotDir}/snapshot_${snapshot.blockNumber}.bin`;
    await fs.promises.writeFile(filePath, snapshot.compressed);
  }

  async getSnapshot(blockNumber: number): Promise<CompressedSnapshot | null> {
    const filePath = `${this.snapshotDir}/snapshot_${blockNumber}.bin`;
    try {
      const compressed = await fs.promises.readFile(filePath);
      return {
        blockNumber,
        compressed,
      };
    } catch (err) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }
}

class DatabaseSnapshotStorage implements SnapshotStorage {
  private db: any; // Database client

  async storeSnapshot(snapshot: CompressedSnapshot): Promise<void> {
    // Save the compressed snapshot to the database
    await this.db.collection('snapshots').insertOne({
      blockNumber: snapshot.blockNumber,
      compressed: snapshot.compressed,
    });
  }

  async getSnapshot(blockNumber: number): Promise<CompressedSnapshot | null> {
    const result = await this.db.collection('snapshots').findOne({ blockNumber });
    if (result) {
      return {
        blockNumber: result.blockNumber,
        compressed: result.compressed,
      };
    }
    return null;
  }
}

export { FileSystemSnapshotStorage, DatabaseSnapshotStorage };