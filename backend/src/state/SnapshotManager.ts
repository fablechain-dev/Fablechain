```typescript
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as crypto from 'crypto';
import { Logger } from '../utils/Logger';
import { WorldState } from './WorldState';
import { Account } from './Account';
import { Entity } from './Entity';

export interface SnapshotMetadata {
  version: number;
  epoch: number;
  timestamp: number;
  stateRoot: string;
  accountCount: number;
  entityCount: number;
  checksum: string;
  compressionType: 'gzip' | 'none';
  fableVersion: string;
}

export interface SnapshotHeader {
  magic: number;
  metadataLength: number;
}

export interface SyncChunk {
  chunkId: number;
  totalChunks: number;
  data: Buffer;
  checksum: string;
  isCompressed: boolean;
}

export interface SnapshotIndex {
  epoch: number;
  offset: number;
  length: number;
  checksum: string;
}

const SNAPSHOT_MAGIC = 0x46414254; // 'FABT'
const SNAPSHOT_VERSION = 1;
const FABLE_VERSION = '0.1.0';
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for fast-sync
const SNAPSHOT_DIR = 'snapshots';

export class SnapshotManager extends EventEmitter {
  private logger: Logger;
  private snapshotDir: string;
  private currentEpoch: number = 0;
  private snapshotIndex: Map<number, SnapshotIndex> = new Map();
  private syncInProgress: boolean = false;

  constructor(logger: Logger, snapshotsBasePath: string = SNAPSHOT_DIR) {
    super();
    this.logger = logger;
    this.snapshotDir = snapshotsBasePath;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.snapshotDir, { recursive: true });
      await this.loadSnapshotIndex();
      this.logger.info('SnapshotManager initialized', {
        snapshotDir: this.snapshotDir,
        indexedSnapshots: this.snapshotIndex.size,
      });
    } catch (error) {
      this.logger.error('Failed to initialize SnapshotManager', { error });
      throw error;
    }
  }

  async createSnapshot(
    worldState: WorldState,
    epoch: number,
  ): Promise<SnapshotMetadata> {
    try {
      this.logger.info('Creating snapshot', { epoch });

      const startTime = Date.now();
      const snapshotPath = this.getSnapshotPath(epoch);

      // Serialize world state
      const serialized = await this.serializeWorldState(worldState);
      const stateRoot = this.calculateStateRoot(serialized);

      // Create metadata
      const metadata: SnapshotMetadata = {
        version: SNAPSHOT_VERSION,
        epoch,
        timestamp: Date.now(),
        stateRoot,
        accountCount: worldState.getAccountCount(),
        entityCount: worldState.getEntityCount(),
        checksum: '',
        compressionType: 'gzip',
        fableVersion: FABLE_VERSION,
      };

      // Write snapshot with compression
      const writeStream = createWriteStream(snapshotPath);
      const gzipStream = zlib.createGzip({
        level: zlib.constants.Z_DEFAULT_COMPRESSION,
      });

      // Write header
      const headerBuffer = Buffer.alloc(8);
      headerBuffer.writeUInt32BE(SNAPSHOT_MAGIC, 0);
      headerBuffer.writeUInt32BE(0, 4); // Placeholder for metadata length

      const metadataJson = JSON.stringify(metadata);
      const metadataBuffer = Buffer.from(metadataJson, 'utf-8');
      const metadataLength = metadataBuffer.length;

      // Update header with actual metadata length
      headerBuffer.writeUInt32BE(metadataLength, 4);

      // Create combined data stream
      const dataBuffer = Buffer.concat([
        headerBuffer,
        metadataBuffer,
        serialized,
      ]);

      metadata.checksum = crypto
        .createHash('sha256')
        .update(dataBuffer)
        .digest('hex');

      // Re-create with correct checksum
      const metadataJsonWithChecksum = JSON.stringify(metadata);
      const metadataBufferWithChecksum = Buffer.from(
        metadataJsonWithChecksum,
        'utf-8',
      );
      headerBuffer.writeUInt32BE(metadataBufferWithChecksum.length, 4);

      const finalDataBuffer = Buffer.concat([
        headerBuffer,
        metadataBufferWithChecksum,
        serialized,
      ]);

      await pipeline(
        async function* () {
          yield finalDataBuffer;
        },
        gzipStream,
        writeStream,
      );

      // Update index
      const stats = await fs.stat(snapshotPath);
      this.snapshotIndex.set(epoch, {
        epoch,
        offset: 0,
        length: stats.size,
        checksum: metadata.checksum,
      });

      await this.saveSnapshotIndex();

      const duration = Date.now() - startTime;
      this.logger.info('Snapshot created successfully', {
        epoch,
        duration,
        fileSize: stats.size,
        stateRoot,
      });

      this.emit('snapshot-created', { epoch, metadata });
      return metadata;
    } catch (error) {
      this.logger.error('Failed to create snapshot', { epoch, error });
      throw error;
    }
  }

  async restoreSnapshot(
    epoch: number,
    worldState: WorldState,
  ): Promise<SnapshotMetadata> {
    try {
      this.logger.info('Restoring snapshot', { epoch });

      const snapshotPath = this.getSnapshotPath(epoch);
      const fileExists = await this.fileExists(snapshotPath);

      if (!fileExists) {
        throw new Error(`Snapshot not found for epoch ${epoch}`);
      }

      const startTime = Date.now();

      // Read and decompress snapshot
      const buffer = await this.readCompressedSnapshot(snapshotPath);

      // Parse header
      let offset = 0;
      const magic = buffer.readUInt32BE(offset);
      offset += 4;

      if (magic !== SNAPSHOT_MAGIC) {
        throw new Error('Invalid snapshot file magic number');
      }

      const metadataLength = buffer.readUInt32BE(offset);
      offset += 4;

      // Parse metadata
      const metadataBuffer = buffer.subarray(offset, offset + metadataLength);
      const metadata: SnapshotMetadata = JSON.parse(
        metadataBuffer.toString('utf-8'),
      );
      offset += metadataLength;

      // Verify checksum
      const expectedChecksum = metadata.checksum;
      const dataToHash = buffer.subarray(
        0,
        offset + (buffer.length - offset),
      );
      const calculatedChecksum = crypto
        .createHash('sha256')
        .update(dataToHash)
        .digest('hex');

      if (calculatedChecksum !== expectedChecksum) {
        throw new Error(
          `Snapshot checksum mismatch. Expected ${expectedChecksum}, got ${calculatedChecksum}`,
        );
      }

      // Deserialize state
      const stateData = buffer.subarray(offset);
      await this.deserializeWorldState(stateData, worldState);

      const duration = Date.now() - startTime;
      this.logger.info('Snapshot restored successfully', {
        epoch,
        duration,
        stateRoot: metadata.stateRoot,
        accountCount: metadata.accountCount,
        entityCount: metadata.