```typescript
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

interface BlockHeader {
  slot: number;
  proposer: string;
  parentRoot: string;
  stateRoot: string;
  bodyRoot: string;
  timestamp: number;
}

interface Block {
  header: BlockHeader;
  body: {
    attestations: Attestation[];
    proposerSlashings: unknown[];
    attesterSlashings: unknown[];
    voluntaryExits: unknown[];
  };
}

interface Attestation {
  committeeIndex: number;
  aggregationBits: string;
  data: {
    slot: number;
    index: number;
    beaconBlockRoot: string;
    source: Checkpoint;
    target: Checkpoint;
  };
  signature: string;
}

interface Checkpoint {
  epoch: number;
  root: string;
}

interface BlockNode {
  block: Block;
  blockRoot: string;
  parent: BlockNode | null;
  children: Set<BlockNode>;
  attestationWeight: number;
  isFinalized: boolean;
  slot: number;
  justifiedCheckpoint: Checkpoint | null;
  finalizedCheckpoint: Checkpoint | null;
}

interface AttestationDelta {
  blockRoot: string;
  weight: number;
  slot: number;
}

const SLOTS_PER_EPOCH = 32;
const WEAK_SUBJECTIVITY_PERIOD = 100000;
const STALE_SLOT_THRESHOLD = 3 * SLOTS_PER_EPOCH;
const ATTESTATION_WEIGHT_MULTIPLIER = 100;

export class ForkChoice extends EventEmitter {
  private blockTree: Map<string, BlockNode> = new Map();
  private headBlocks: Map<string, BlockNode> = new Map();
  private genesisRoot: string = '';
  private justifiedCheckpoint: Checkpoint | null = null;
  private finalizedCheckpoint: Checkpoint | null = null;
  private currentSlot: number = 0;
  private attestationPool: Map<string, AttestationDelta[]> = new Map();
  private pruningInterval: NodeJS.Timeout | null = null;
  private readonly PRUNING_INTERVAL_MS = 30000;

  constructor() {
    super();
    this.initializePruning();
  }

  public initialize(genesisBlock: Block, genesisRoot: string): void {
    if (this.blockTree.size > 0) {
      throw new Error('ForkChoice already initialized');
    }

    this.genesisRoot = genesisRoot;
    const genesisNode: BlockNode = {
      block: genesisBlock,
      blockRoot: genesisRoot,
      parent: null,
      children: new Set(),
      attestationWeight: 0,
      isFinalized: true,
      slot: genesisBlock.header.slot,
      justifiedCheckpoint: null,
      finalizedCheckpoint: null,
    };

    this.blockTree.set(genesisRoot, genesisNode);
    this.headBlocks.set(genesisRoot, genesisNode);
    this.justifiedCheckpoint = { epoch: 0, root: genesisRoot };
    this.finalizedCheckpoint = { epoch: 0, root: genesisRoot };

    this.emit('initialized', { genesisRoot, slot: genesisBlock.header.slot });
  }

  public onBlock(block: Block, blockRoot: string): boolean {
    const parentRoot = block.header.parentRoot;

    if (!this.blockTree.has(parentRoot)) {
      throw new Error(`Unknown parent block: ${parentRoot}`);
    }

    const parentNode = this.blockTree.get(parentRoot)!;

    if (this.blockTree.has(blockRoot)) {
      return false;
    }

    const blockNode: BlockNode = {
      block,
      blockRoot,
      parent: parentNode,
      children: new Set(),
      attestationWeight: 0,
      isFinalized: false,
      slot: block.header.slot,
      justifiedCheckpoint: parentNode.justifiedCheckpoint,
      finalizedCheckpoint: parentNode.finalizedCheckpoint,
    };

    this.blockTree.set(blockRoot, blockNode);
    parentNode.children.add(blockNode);

    if (parentNode.children.size > 1) {
      this.headBlocks.delete(parentRoot);
    }

    this.headBlocks.set(blockRoot, blockNode);
    this.currentSlot = Math.max(this.currentSlot, block.header.slot);

    this.emit('blockAdded', {
      blockRoot,
      slot: block.header.slot,
      parentRoot,
    });

    return true;
  }

  public onAttestation(attestation: Attestation, validatorCount: number): void {
    const beaconBlockRoot = attestation.data.beaconBlockRoot;

    if (!this.blockTree.has(beaconBlockRoot)) {
      throw new Error(`Attested block not found: ${beaconBlockRoot}`);
    }

    const attestingBits = this.countSetBits(attestation.aggregationBits);
    const weight = Math.floor(
      (attestingBits * validatorCount * ATTESTATION_WEIGHT_MULTIPLIER) / 100
    );

    if (!this.attestationPool.has(beaconBlockRoot)) {
      this.attestationPool.set(beaconBlockRoot, []);
    }

    const deltas = this.attestationPool.get(beaconBlockRoot)!;
    deltas.push({
      blockRoot: beaconBlockRoot,
      weight,
      slot: attestation.data.slot,
    });

    this.applyAttestationWeight(beaconBlockRoot, weight);
  }

  public getHead(): BlockNode {
    const heads = Array.from(this.headBlocks.values());

    if (heads.length === 0) {
      throw new Error('No head blocks available');
    }

    let maxWeightHead = heads[0];
    let maxWeight = this.calculateHeadWeight(heads[0]);

    for (let i = 1; i < heads.length; i++) {
      const weight = this.calculateHeadWeight(heads[i]);
      if (weight > maxWeight) {
        maxWeight = weight;
        maxWeightHead = heads[i];
      }
    }

    return maxWeightHead;
  }

  public justifyCheckpoint(checkpoint: Checkpoint): void {
    if (!this.blockTree.has(checkpoint.root)) {
      throw new Error(`Checkpoint block not found: ${checkpoint.root}`);
    }

    const previousJustified = this.justifiedCheckpoint;
    this.justifiedCheckpoint = checkpoint;

    const checkpointNode = this.blockTree.get(checkpoint.root)!;
    checkpointNode.justifiedCheckpoint = checkpoint;

    this.emit('checkpointJustified', {
      checkpoint,
      previousCheckpoint: previousJustified,
    });
  }

  public finalizeCheckpoint(checkpoint: Checkpoint): void {
    if (!this.blockTree.has(checkpoint.root)) {
      throw new Error(`Checkpoint block not found: ${checkpoint.root}`);
    }

    const checkpointNode = this.blockTree.get(checkpoint.root)!;
    checkpointNode.isFinalized = true;
    checkpointNode.finalizedCheckpoint = checkpoint;

    const previousFinalized = this.finalizedCheckpoint;
    this.finalizedCheckpoint = checkpoint;

    this.markBranchAsFinalized(checkpointNode);
    this.emit('checkpointFinalized', {
      checkpoint,
      previousCheckpoint: previousFinalized,
    });
  }

  public getAllHeads(): BlockNode[] {
    return Array.from(this.headBlocks.values());
  }

  public getAncestor(blockRoot: string, slot: number): BlockNode | null {
    let node = this.blockTree.get(blockRoot);

    while (node && node.slot > slot) {
      if (node.parent === null) {