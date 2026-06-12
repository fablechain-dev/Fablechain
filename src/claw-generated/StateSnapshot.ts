export interface Snapshot {
  blockNumber: number;
  state: any;
}

export interface CompressedSnapshot {
  blockNumber: number;
  compressed: Uint8Array;
}

export interface CompressionAlgorithm {
  compress(data: string): Promise<Uint8Array>;
  decompress(data: Uint8Array): Promise<string>;
}

export interface SnapshotStorage {
  storeSnapshot(snapshot: CompressedSnapshot): Promise<void>;
  getSnapshot(blockNumber: number): Promise<CompressedSnapshot | null>;
}