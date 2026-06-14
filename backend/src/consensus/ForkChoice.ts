```typescript
import { EventEmitter } from 'events';
import { Logger } from 'pino';

interface Block {
  hash: string;
  parentHash: string;
  slot: number;
  proposer: string;
  timestamp: number;
}

interface Attestation {
  blockRoot: string;
  validatorIndices: number[];
  slot: number;
}

interface ValidatorInfo {
  index: number;
  effectiveBalance: bigint;
  active: boolean;
}

interface ForkNode {
  block: Block;
  children: Map<string, ForkNode>;
  parent: ForkNode | null;
  attestationWeight: bigint;
  lastAttestationSlot: number;
}

interface ForkChoiceStore {
  justifiedCheckpoint: { root: string; epoch: number };
  finalizedCheckpoint: { root: string; epoch: number };
  headRoot: string;
  headSlot: number;
  allNodes: Map<string, ForkNode>;
}

const SLOTS_PER_EPOCH = 32;
const VALIDATOR_BALANCE_MULTIPLIER = 1n;
const STALE_HEAD_THRESHOLD = 8; // slots

export class ForkChoice extends EventEmitter {
  private store: ForkChoiceStore;
  private validators: Map<number, ValidatorInfo>;
  private logger: Logger;
  private pruneInterval: NodeJS.Timer | null = null;

  constructor(genesisBlock: Block, logger: Logger) {
    super();
    this.logger = logger;
    this.validators = new Map();

    const genesisNode: ForkNode = {
      block: genesisBlock,
      children: new Map(),
      parent: null,
      attestationWeight: 0n,
      lastAttestationSlot: genesisBlock.slot,
    };

    this.store = {
      justifiedCheckpoint: { root: genesisBlock.hash, epoch: 0 },
      finalizedCheckpoint: { root: genesisBlock.hash, epoch: 0 },
      headRoot: genesisBlock.hash,
      headSlot: genesisBlock.slot,
      allNodes: new Map([[genesisBlock.hash, genesisNode]]),
    };
  }

  public registerValidator(validator: ValidatorInfo): void {
    this.validators.set(validator.index, validator);
  }

  public onBlock(block: Block): string {
    const parentNode = this.store.allNodes.get(block.parentHash);
    if (!parentNode) {
      this.logger.warn(
        { blockHash: block.hash, parentHash: block.parentHash },
        'Parent block not found in fork tree'
      );
      throw new Error(`Parent block ${block.parentHash} not found`);
    }

    const newNode: ForkNode = {
      block,
      children: new Map(),
      parent: parentNode,
      attestationWeight: 0n,
      lastAttestationSlot: block.slot,
    };

    this.store.allNodes.set(block.hash, newNode);
    parentNode.children.set(block.hash, newNode);

    this.logger.debug(
      { blockHash: block.hash, slot: block.slot, parentHash: block.parentHash },
      'Block added to fork tree'
    );

    this.updateHead();
    return block.hash;
  }

  public onAttestation(attestation: Attestation): void {
    const targetNode = this.store.allNodes.get(attestation.blockRoot);
    if (!targetNode) {
      this.logger.warn(
        { blockRoot: attestation.blockRoot },
        'Attestation target block not found'
      );
      return;
    }

    let totalWeight = 0n;
    for (const validatorIndex of attestation.validatorIndices) {
      const validator = this.validators.get(validatorIndex);
      if (validator && validator.active) {
        totalWeight += validator.effectiveBalance;
      }
    }

    targetNode.attestationWeight += totalWeight;
    targetNode.lastAttestationSlot = Math.max(
      targetNode.lastAttestationSlot,
      attestation.slot
    );

    this.logger.debug(
      {
        blockRoot: attestation.blockRoot,
        attestingValidators: attestation.validatorIndices.length,
        weight: totalWeight.toString(),
      },
      'Attestation applied to fork node'
    );

    this.updateHead();
  }

  public justifyCheckpoint(root: string, epoch: number): void {
    const node = this.store.allNodes.get(root);
    if (!node) {
      this.logger.warn({ root, epoch }, 'Cannot justify non-existent block');
      return;
    }

    this.store.justifiedCheckpoint = { root, epoch };
    this.logger.info({ root, epoch }, 'Checkpoint justified');
  }

  public finalizeCheckpoint(root: string, epoch: number): void {
    const node = this.store.allNodes.get(root);
    if (!node) {
      this.logger.warn({ root, epoch }, 'Cannot finalize non-existent block');
      return;
    }

    this.store.finalizedCheckpoint = { root, epoch };
    this.pruneTree();
    this.logger.info({ root, epoch }, 'Checkpoint finalized');
  }

  private updateHead(): void {
    const newHead = this.selectHead();
    if (newHead.hash !== this.store.headRoot) {
      this.logger.info(
        {
          previousHead: this.store.headRoot,
          newHead: newHead.hash,
          slot: newHead.slot,
        },
        'Head updated'
      );
      this.store.headRoot = newHead.hash;
      this.store.headSlot = newHead.slot;
      this.emit('headUpdated', { block: newHead });
    }
  }

  private selectHead(): Block {
    const node = this.store.allNodes.get(this.store.headRoot);
    if (!node) {
      throw new Error('Head node disappeared from fork tree');
    }

    let current = node;

    while (current.children.size > 0) {
      let bestChild: ForkNode | null = null;
      let bestScore = -1n;

      for (const [, child] of current.children) {
        const score = this.scoreNode(child);
        if (score > bestScore) {
          bestScore = score;
          bestChild = child;
        }
      }

      if (bestChild === null) {
        break;
      }

      current = bestChild;
    }

    return current.block;
  }

  private scoreNode(node: ForkNode): bigint {
    const slotsSinceLastAttestation = Math.max(
      0,
      this.store.headSlot - node.lastAttestationSlot
    );

    let score = node.attestationWeight;

    if (slotsSinceLastAttestation < STALE_HEAD_THRESHOLD) {
      score += BigInt(STALE_HEAD_THRESHOLD - slotsSinceLastAttestation) * 100n;
    }

    const blockAge = this.store.headSlot - node.block.slot;
    if (blockAge > 0) {
      score -= BigInt(blockAge) * 10n;
    }

    return score;
  }

  private pruneTree(): void {
    const finalizedNode = this.store.allNodes.get(
      this.store.finalizedCheckpoint.root
    );
    if (!finalizedNode) {
      return;
    }

    const nodesToKeep = new Set<string>();
    this.collectAncestors(
      this.store.allNodes.get(this.store.headRoot)!,
      nodesToKeep
    );
    this.collectDescendants(finalizedNode, nodesToKeep);

    const nodesToDelete: string[] = [];
    for (const [hash] of this.store.allNodes) {
      if (!nodesToKeep.has(hash)) {
        nodesToDelete.push(hash);
      }
    }

    for