```typescript
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { BlockStore } from './BlockStore';
import { StateDB } from './StateDB';
import { PeerManager } from '../network/PeerManager';
import { SnapshotManager } from './SnapshotManager';

export interface SyncConfig {
  maxPeers: number;
  requestTimeout: number;
  maxBlocksPerRequest: number;
  snapshotSyncThreshold: number;
  reorgDepth: number;
  validateBlocks: boolean;
}

export interface BlockHeader {
  hash: string;
  parentHash: string;
  number: bigint;
  timestamp: number;
  miner: string;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  difficulty: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  nonce: string;
}

export interface Block {
  header: BlockHeader;
  transactions: Transaction[];
  uncles: BlockHeader[];
}

export interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: bigint;
  data: string;
  gasPrice: bigint;
  gasLimit: bigint;
  nonce: number;
  signature: string;
}

export interface SyncState {
  currentHeight: bigint;
  targetHeight: bigint;
  isSyncing: boolean;
  mode: 'idle' | 'snapshot' | 'fast' | 'incremental';
  lastBlockHash: string;
  peersConnected: number;
}

export class ChainSync extends EventEmitter {
  private logger: Logger;
  private blockStore: BlockStore;
  private stateDB: StateDB;
  private peerManager: PeerManager;
  private snapshotManager: SnapshotManager;
  private config: SyncConfig;
  private syncState: SyncState;
  private activeRequests: Map<string, Promise<Block[]>>;
  private canonicalChain: string[] = [];
  private pendingBlocks: Map<string, Block> = new Map();

  constructor(
    blockStore: BlockStore,
    stateDB: StateDB,
    peerManager: PeerManager,
    snapshotManager: SnapshotManager,
    config: SyncConfig,
    logger: Logger
  ) {
    super();
    this.blockStore = blockStore;
    this.stateDB = stateDB;
    this.peerManager = peerManager;
    this.snapshotManager = snapshotManager;
    this.config = config;
    this.logger = logger;
    this.activeRequests = new Map();
    this.syncState = {
      currentHeight: BigInt(0),
      targetHeight: BigInt(0),
      isSyncing: false,
      mode: 'idle',
      lastBlockHash: '',
      peersConnected: 0,
    };
  }

  public async start(): Promise<void> {
    this.logger.info('Starting chain sync');
    this.peerManager.on('peers-updated', (peers) => this.handlePeersUpdated(peers));
    this.peerManager.on('block-announced', (block) => this.handleBlockAnnounced(block));

    const currentHeight = await this.blockStore.getHighestBlockNumber();
    this.syncState.currentHeight = currentHeight;
    this.canonicalChain = await this.blockStore.getCanonicalChain();

    await this.synchronize();
  }

  public async stop(): Promise<void> {
    this.logger.info('Stopping chain sync');
    this.syncState.isSyncing = false;
    this.activeRequests.clear();
    this.pendingBlocks.clear();
  }

  private async synchronize(): Promise<void> {
    try {
      const peers = this.peerManager.getActivePeers();
      if (peers.length === 0) {
        this.logger.warn('No active peers available for sync');
        return;
      }

      const targetHeight = await this.getTargetHeight(peers);
      this.syncState.targetHeight = targetHeight;
      this.syncState.peersConnected = peers.length;

      const heightDiff = targetHeight - this.syncState.currentHeight;
      this.logger.info(`Chain height difference: ${heightDiff}`);

      if (heightDiff === BigInt(0)) {
        this.syncState.mode = 'idle';
        this.logger.info('Chain is synchronized');
        this.emit('synced');
        return;
      }

      if (heightDiff > BigInt(this.config.snapshotSyncThreshold)) {
        await this.performSnapshotSync(peers, targetHeight);
      } else {
        await this.performIncrementalSync(peers, targetHeight);
      }
    } catch (error) {
      this.logger.error('Sync error', error);
      this.emit('sync-error', error);
    }
  }

  private async performSnapshotSync(peers: any[], targetHeight: bigint): Promise<void> {
    this.logger.info('Starting snapshot sync');
    this.syncState.mode = 'snapshot';
    this.syncState.isSyncing = true;

    try {
      const snapshotHeight = targetHeight - BigInt(128);
      const snapshot = await this.snapshotManager.downloadSnapshot(peers, snapshotHeight);

      if (!snapshot) {
        this.logger.warn('Snapshot download failed, falling back to incremental sync');
        await this.performIncrementalSync(peers, targetHeight);
        return;
      }

      await this.stateDB.applySnapshot(snapshot);
      this.syncState.currentHeight = snapshotHeight;
      this.logger.info(`Snapshot applied at height ${snapshotHeight}`);

      this.emit('snapshot-applied', { height: snapshotHeight });

      await this.performIncrementalSync(peers, targetHeight);
    } catch (error) {
      this.logger.error('Snapshot sync failed', error);
      throw error;
    }
  }

  private async performIncrementalSync(peers: any[], targetHeight: bigint): Promise<void> {
    this.logger.info('Starting incremental sync');
    this.syncState.mode = this.syncState.currentHeight === BigInt(0) ? 'fast' : 'incremental';
    this.syncState.isSyncing = true;

    let currentHeight = this.syncState.currentHeight;
    const batchSize = BigInt(this.config.maxBlocksPerRequest);

    while (currentHeight < targetHeight && this.syncState.isSyncing) {
      const endHeight = currentHeight + batchSize > targetHeight 
        ? targetHeight 
        : currentHeight + batchSize;

      try {
        const blocks = await this.fetchBlockRange(peers, currentHeight + BigInt(1), endHeight);
        
        if (blocks.length === 0) {
          this.logger.warn('No blocks received in range');
          await this.delay(1000);
          continue;
        }

        const validated = await this.validateBlocks(blocks, currentHeight);
        
        if (!validated) {
          this.logger.warn('Block validation failed, initiating reorg');
          await this.handleReorg(peers);
          continue;
        }

        await this.applyBlocks(blocks);
        currentHeight = endHeight;
        this.syncState.currentHeight = currentHeight;

        this.emit('sync-progress', {
          current: Number(currentHeight),
          target: Number(targetHeight),
          percentage: Number((currentHeight * BigInt(100)) / targetHeight),
        });
      } catch (error) {
        this.logger.error('Error in incremental sync', error);
        await this.delay(2000);
      }
    }

    if (currentHeight >= targetHeight) {
      this.syncState.isSyncing = false;
      this.syncState.mode = 'idle';
      this.logger.info('Incremental sync completed');
      this.emit('synced');
    }
  }

  private async fetchBlockRange(peers: