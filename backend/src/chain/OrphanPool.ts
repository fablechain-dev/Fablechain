```typescript
import { EventEmitter } from 'events';
import { Block } from './Block';
import { BlockHash, BlockHeader } from './types';
import { Logger } from '../utils/Logger';

interface OrphanBlockEntry {
  block: Block;
  receivedAt: number;
  retries: number;
}

interface OrphanPoolConfig {
  maxOrphanBlocks: number;
  orphanBlockTimeout: number;
  maxRetries: number;
  cleanupInterval: number;
}

const DEFAULT_CONFIG: OrphanPoolConfig = {
  maxOrphanBlocks: 10000,
  orphanBlockTimeout: 3600000, // 1 hour
  maxRetries: 3,
  cleanupInterval: 300000, // 5 minutes
};

export class OrphanPool extends EventEmitter {
  private orphanBlocks: Map<BlockHash, OrphanBlockEntry> = new Map();
  private childrenByParentHash: Map<BlockHash, BlockHash[]> = new Map();
  private config: OrphanPoolConfig;
  private logger: Logger;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<OrphanPoolConfig> = {}, logger?: Logger) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger || new Logger('OrphanPool');
  }

  public start(): void {
    if (this.cleanupTimer) {
      return;
    }
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
    this.logger.info('OrphanPool started');
  }

  public stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.orphanBlocks.clear();
    this.childrenByParentHash.clear();
    this.logger.info('OrphanPool stopped');
  }

  public addOrphanBlock(block: Block): boolean {
    const blockHash = block.getHash();
    const parentHash = block.header.parentHash;

    // Check if block is already in pool
    if (this.orphanBlocks.has(blockHash)) {
      return false;
    }

    // Check pool size limit
    if (this.orphanBlocks.size >= this.config.maxOrphanBlocks) {
      this.evictOldest();
    }

    const entry: OrphanBlockEntry = {
      block,
      receivedAt: Date.now(),
      retries: 0,
    };

    this.orphanBlocks.set(blockHash, entry);

    // Index children by parent hash for quick lookup when parent arrives
    if (!this.childrenByParentHash.has(parentHash)) {
      this.childrenByParentHash.set(parentHash, []);
    }
    this.childrenByParentHash.get(parentHash)!.push(blockHash);

    this.logger.debug(
      `Added orphan block ${blockHash.toString('hex').slice(0, 8)}... (parent: ${parentHash.toString('hex').slice(0, 8)}...)`
    );
    this.emit('orphan-added', block);

    return true;
  }

  public getOrphansByParent(parentHash: BlockHash): Block[] {
    const children = this.childrenByParentHash.get(parentHash) || [];
    const blocks: Block[] = [];

    for (const childHash of children) {
      const entry = this.orphanBlocks.get(childHash);
      if (entry) {
        blocks.push(entry.block);
      }
    }

    return blocks;
  }

  public removeOrphanBlock(blockHash: BlockHash): boolean {
    const entry = this.orphanBlocks.get(blockHash);
    if (!entry) {
      return false;
    }

    const parentHash = entry.block.header.parentHash;

    // Remove from orphan blocks map
    this.orphanBlocks.delete(blockHash);

    // Remove from children index
    const children = this.childrenByParentHash.get(parentHash);
    if (children) {
      const index = children.indexOf(blockHash);
      if (index !== -1) {
        children.splice(index, 1);
      }
      if (children.length === 0) {
        this.childrenByParentHash.delete(parentHash);
      }
    }

    this.logger.debug(
      `Removed orphan block ${blockHash.toString('hex').slice(0, 8)}...`
    );
    this.emit('orphan-removed', blockHash);

    return true;
  }

  public hasOrphanBlock(blockHash: BlockHash): boolean {
    return this.orphanBlocks.has(blockHash);
  }

  public getOrphanBlock(blockHash: BlockHash): Block | null {
    const entry = this.orphanBlocks.get(blockHash);
    return entry ? entry.block : null;
  }

  public getOrphanCount(): number {
    return this.orphanBlocks.size;
  }

  public getOrphanBlocksByHeight(height: number): Block[] {
    const blocks: Block[] = [];
    for (const entry of this.orphanBlocks.values()) {
      if (entry.block.header.height === height) {
        blocks.push(entry.block);
      }
    }
    return blocks;
  }

  public processResolvedParent(parentHash: BlockHash): BlockHash[] {
    const resolvedChildren = this.getOrphansByParent(parentHash);
    const resolvedHashes: BlockHash[] = [];

    for (const block of resolvedChildren) {
      const blockHash = block.getHash();
      this.removeOrphanBlock(blockHash);
      resolvedHashes.push(blockHash);
    }

    if (resolvedHashes.length > 0) {
      this.logger.info(
        `Resolved ${resolvedHashes.length} orphan blocks for parent ${parentHash.toString('hex').slice(0, 8)}...`
      );
      this.emit('orphans-resolved', parentHash, resolvedHashes);
    }

    return resolvedHashes;
  }

  public incrementRetryCount(blockHash: BlockHash): number {
    const entry = this.orphanBlocks.get(blockHash);
    if (entry) {
      entry.retries++;
      if (entry.retries > this.config.maxRetries) {
        this.removeOrphanBlock(blockHash);
        this.logger.warn(
          `Orphan block ${blockHash.toString('hex').slice(0, 8)}... exceeded max retries`
        );
        this.emit('orphan-evicted', blockHash, 'max-retries');
      }
      return entry.retries;
    }
    return 0;
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredBlocks: BlockHash[] = [];

    for (const [hash, entry] of this.orphanBlocks.entries()) {
      if (now - entry.receivedAt > this.config.orphanBlockTimeout) {
        expiredBlocks.push(hash);
      }
    }

    for (const hash of expiredBlocks) {
      this.removeOrphanBlock(hash);
      this.emit('orphan-evicted', hash, 'timeout');
    }

    if (expiredBlocks.length > 0) {
      this.logger.debug(`Cleaned up ${expiredBlocks.length} expired orphan blocks`);
    }
  }

  private evictOldest(): void {
    let oldestHash: BlockHash | null = null;
    let oldestTime = Date.now();

    for (const [hash, entry] of this.orphanBlocks.entries()) {
      if (entry.receivedAt < oldestTime) {
        oldestTime = entry.receivedAt;
        oldestHash = hash;
      }
    }

    if (oldestHash) {
      this.removeOrphanBlock(oldestHash);
      this.emit('orphan-