```typescript
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { createHash } from 'crypto';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

interface WorldStateSnapshot {
  epoch: number;
  timestamp: number;
  stateHash: string;
  entities: Map<string, EntityState>;
  systems: Map<string, SystemState>;
  metadata: SnapshotMetadata;
}

interface EntityState {
  id: string;
  components: Map<string, unknown>;
  version: number;
  lastModified: number;
}

interface SystemState {
  id: string;
  data: unknown;
  version: number;
}

interface SnapshotMetadata {
  chainId: number;
  version: string;
  blockHeight: number;
  validator: string;
  signature: string;
  previousHash: string;
}

interface SnapshotManifest {
  epoch: number;
  hash: string;
  size: number;
  timestamp: number;
  blockHeight: number;
  checksums: Map<string, string>;
}

interface SyncPeerInfo {
  peerId: string;
  lastSnapshotEpoch: number;
  availableSnapshots: number[];
  latency: number;
}

interface ChunkMetadata {
  chunkIndex: number;
  totalChunks: number;
  hash: string;
  snapshotHash: string;
  size: number;
}

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const SNAPSHOT_VERSION = '1.0.0';
const SNAPSHOT_RETENTION = 5; // Keep last 5 snapshots

export class SnapshotManager extends EventEmitter {
  private snapshotDir: string;
  private currentSnapshot: WorldStateSnapshot | null = null;
  private snapshots: Map<number, SnapshotManifest> = new Map();
  private syncPeers: Map<string, SyncPeerInfo> = new Map();
  private inProgressChunks: Map<string, Map<number, Buffer>> = new Map();

  constructor(snapshotDir: string = './snapshots') {
    super();
    this.snapshotDir = snapshotDir;
    this.initializeDirectory();
  }

  private async initializeDirectory(): Promise<void> {
    try {
      await mkdir(this.snapshotDir, { recursive: true });
      await this.loadManifests();
    } catch (error) {
      this.emit('error', new Error(`Failed to initialize snapshot directory: ${error}`));
    }
  }

  async createSnapshot(
    epoch: number,
    entities: Map<string, EntityState>,
    systems: Map<string, SystemState>,
    metadata: SnapshotMetadata
  ): Promise<string> {
    try {
      const snapshot: WorldStateSnapshot = {
        epoch,
        timestamp: Date.now(),
        stateHash: '',
        entities,
        systems,
        metadata,
      };

      snapshot.stateHash = this.computeStateHash(snapshot);

      const serialized = this.serializeSnapshot(snapshot);
      const snapshotHash = createHash('sha256').update(serialized).digest('hex');

      const filePath = path.join(this.snapshotDir, `snapshot-${epoch}.bin`);
      const compressedData = await gzip(serialized);

      await writeFile(filePath, compressedData);

      const manifest: SnapshotManifest = {
        epoch,
        hash: snapshotHash,
        size: compressedData.length,
        timestamp: snapshot.timestamp,
        blockHeight: metadata.blockHeight,
        checksums: new Map(),
      };

      this.snapshots.set(epoch, manifest);
      this.currentSnapshot = snapshot;

      await this.saveManifests();
      await this.pruneOldSnapshots();

      this.emit('snapshot-created', {
        epoch,
        hash: snapshotHash,
        size: compressedData.length,
      });

      return snapshotHash;
    } catch (error) {
      throw new Error(`Failed to create snapshot at epoch ${epoch}: ${error}`);
    }
  }

  async loadSnapshot(epoch: number): Promise<WorldStateSnapshot> {
    try {
      const filePath = path.join(this.snapshotDir, `snapshot-${epoch}.bin`);
      const compressedData = await readFile(filePath);
      const decompressed = await gunzip(compressedData);

      const snapshot = this.deserializeSnapshot(decompressed);

      if (!this.verifyStateHash(snapshot)) {
        throw new Error(`State hash mismatch for epoch ${epoch}`);
      }

      this.currentSnapshot = snapshot;
      this.emit('snapshot-loaded', { epoch, hash: snapshot.stateHash });

      return snapshot;
    } catch (error) {
      throw new Error(`Failed to load snapshot for epoch ${epoch}: ${error}`);
    }
  }

  private serializeSnapshot(snapshot: WorldStateSnapshot): Buffer {
    const buffers: Buffer[] = [];

    // Header
    const header = Buffer.alloc(64);
    let offset = 0;

    header.writeUInt32BE(snapshot.epoch, offset);
    offset += 4;
    header.writeBigInt64BE(BigInt(snapshot.timestamp), offset);
    offset += 8;
    Buffer.from(snapshot.stateHash, 'hex').copy(header, offset, 0, 32);
    offset += 32;
    header.writeUInt32BE(snapshot.metadata.blockHeight, offset);
    offset += 4;
    header.writeUInt32BE(snapshot.metadata.chainId, offset);
    offset += 4;
    header.writeUInt16BE(snapshot.stateHash.length, offset);
    offset += 2;

    buffers.push(header);

    // Entities
    const entityCount = Buffer.alloc(4);
    entityCount.writeUInt32BE(snapshot.entities.size);
    buffers.push(entityCount);

    for (const [entityId, entityState] of snapshot.entities) {
      buffers.push(this.serializeEntity(entityId, entityState));
    }

    // Systems
    const systemCount = Buffer.alloc(4);
    systemCount.writeUInt32BE(snapshot.systems.size);
    buffers.push(systemCount);

    for (const [systemId, systemState] of snapshot.systems) {
      buffers.push(this.serializeSystem(systemId, systemState));
    }

    // Metadata
    buffers.push(this.serializeMetadata(snapshot.metadata));

    return Buffer.concat(buffers);
  }

  private deserializeSnapshot(buffer: Buffer): WorldStateSnapshot {
    let offset = 0;

    const epoch = buffer.readUInt32BE(offset);
    offset += 4;

    const timestamp = Number(buffer.readBigInt64BE(offset));
    offset += 8;

    const stateHash = buffer.slice(offset, offset + 32).toString('hex');
    offset += 32;

    const blockHeight = buffer.readUInt32BE(offset);
    offset += 4;

    const chainId = buffer.readUInt32BE(offset);
    offset += 4;

    offset += 2; // Skip hash length field

    // Deserialize entities
    const entities = new Map<string, EntityState>();
    const entityCount = buffer.readUInt32BE(offset);
    offset += 4;

    for (let i = 0; i < entityCount; i++) {
      const { entityId, entityState, bytesRead } = this.deserializeEntity(
        buffer,
        offset
      );
      entities.set(entityId, entityState);
      offset += bytesRead;
    }

    // Deserialize systems
    const systems = new Map