```typescript
import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { BlockStore } from './BlockStore';
import { StateManager } from './StateManager';
import { MempoolManager } from './MempoolManager';
import {
  Block,
  BlockHeader,
  Chain,
  ChainReorgEvent,
  ValidationError,
  ChainState,
} from '../types';

interface ReorgContext {
  commonAncestorHeight: number;
  commonAncestorHash: string;
  rollbackHeight: number;
  replayHeight: number;
  oldBranchLength: number;
  newBranchLength: number;
  timestamp: number;
}

interface RollbackSnapshot {
  height: number;
  hash: string;
  stateRoot: string;
  timestamp: number;
}

export class ReorgHandler extends EventEmitter {
  private blockStore: BlockStore;
  private stateManager: StateManager;
  private mempoolManager: MempoolManager;
  private logger: Logger;
  private isReorging: boolean = false;
  private reorgLock: Promise<void> = Promise.resolve();
  private rollbackSnapshots: Map<number, RollbackSnapshot> = new Map();
  private maxReorgDepth: number;

  constructor(
    blockStore: BlockStore,
    stateManager: StateManager,
    mempoolManager: MempoolManager,
    logger: Logger,
    maxReorgDepth: number = 100,
  ) {
    super();
    this.blockStore = blockStore;
    this.stateManager = stateManager;
    this.mempoolManager = mempoolManager;
    this.logger = logger;
    this.maxReorgDepth = maxReorgDepth;
  }

  /**
   * Handle a potential chain reorganization when a new block with higher cumulative difficulty
   * arrives that doesn't extend the current canonical chain
   */
  async handlePotentialReorg(newBlock: Block, newChainTip: Block): Promise<boolean> {
    return this.executeWithLock(async () => {
      if (this.isReorging) {
        this.logger.warn('Reorg already in progress, queueing new attempt');
        return false;
      }

      try {
        this.isReorging = true;
        const currentTip = await this.blockStore.getTip();

        if (!currentTip) {
          this.logger.error('No current chain tip found');
          return false;
        }

        // Check if reorg is actually needed
        if (newChainTip.header.hash === currentTip.header.hash) {
          return false;
        }

        const commonAncestor = await this.findCommonAncestor(
          currentTip,
          newChainTip,
        );

        if (!commonAncestor) {
          this.logger.error('No common ancestor found between chains');
          return false;
        }

        const reorgContext = await this.validateReorg(
          currentTip,
          newChainTip,
          commonAncestor,
        );

        if (!reorgContext) {
          this.logger.warn('Reorg validation failed');
          return false;
        }

        this.logger.info(`Initiating reorg: rolling back to height ${reorgContext.commonAncestorHeight}`);

        await this.executeReorg(reorgContext, currentTip, newChainTip);

        this.emitReorgEvent(reorgContext, currentTip, newChainTip);

        return true;
      } catch (error) {
        this.logger.error('Fatal error during reorg handling', { error });
        await this.attemptRecovery(newBlock);
        return false;
      } finally {
        this.isReorging = false;
      }
    });
  }

  /**
   * Find the common ancestor block between two chain branches
   */
  private async findCommonAncestor(
    block1: Block,
    block2: Block,
  ): Promise<Block | null> {
    const ancestors1 = new Map<string, Block>();
    const ancestors2 = new Set<string>();

    let current = block1;
    let depth = 0;

    // Traverse block1's ancestry
    while (current && depth < this.maxReorgDepth) {
      ancestors1.set(current.header.hash, current);
      if (current.header.parentHash === '0x0') break;

      const parent = await this.blockStore.getBlockByHash(current.header.parentHash);
      if (!parent) {
        this.logger.warn('Parent block not found', {
          hash: current.header.parentHash,
        });
        break;
      }

      current = parent;
      depth++;
    }

    // Traverse block2's ancestry and find intersection
    current = block2;
    depth = 0;

    while (current && depth < this.maxReorgDepth) {
      if (ancestors1.has(current.header.hash)) {
        return ancestors1.get(current.header.hash) || null;
      }

      ancestors2.add(current.header.hash);
      if (current.header.parentHash === '0x0') break;

      const parent = await this.blockStore.getBlockByHash(current.header.parentHash);
      if (!parent) {
        this.logger.warn('Parent block not found in second chain', {
          hash: current.header.parentHash,
        });
        break;
      }

      current = parent;
      depth++;
    }

    return null;
  }

  /**
   * Validate that the reorg is safe and beneficial
   */
  private async validateReorg(
    currentTip: Block,
    newTip: Block,
    commonAncestor: Block,
  ): Promise<ReorgContext | null> {
    const currentHeight = currentTip.header.height;
    const newHeight = newTip.header.height;
    const commonHeight = commonAncestor.header.height;

    const reorgDepth = currentHeight - commonHeight;

    // Validate reorg depth is within safe limits
    if (reorgDepth > this.maxReorgDepth) {
      this.logger.error('Reorg depth exceeds maximum allowed', {
        depth: reorgDepth,
        maxAllowed: this.maxReorgDepth,
      });
      return null;
    }

    // Validate that new chain has higher cumulative difficulty
    if (newTip.header.cumulativeDifficulty <= currentTip.header.cumulativeDifficulty) {
      this.logger.warn('New chain does not have higher cumulative difficulty', {
        currentDiff: currentTip.header.cumulativeDifficulty,
        newDiff: newTip.header.cumulativeDifficulty,
      });
      return null;
    }

    // Validate new chain blocks exist and are valid
    let blockCount = 0;
    let current = newTip;

    while (current.header.hash !== commonAncestor.header.hash && blockCount < reorgDepth + 100) {
      if (!current.header.parentHash || current.header.parentHash === '0x0') {
        break;
      }

      const parent = await this.blockStore.getBlockByHash(current.header.parentHash);
      if (!parent) {
        this.logger.error('New chain block parent not found', {
          hash: current.header.parentHash,
        });
        return null;
      }

      current = parent;
      blockCount++;
    }

    const reorgContext: ReorgContext = {
      commonAncestorHeight: commonHeight,
      commonAncestorHash: commonAncestor.header.hash,
      rollbackHeight: currentHeight,
      replayHeight: newHeight,
      oldBranchLength: reorgDepth,
      newBranchLength: newHeight - commonHeight,
      timestamp: Date.now(),
    };

    return reorgContext;
  }

  /**
   * Execute the reorg: rollback state, replay new blocks
   */
  private async executeReorg(
    context: ReorgContext,
    oldTip: Block,
    newT