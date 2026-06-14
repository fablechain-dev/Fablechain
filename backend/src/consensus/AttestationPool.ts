```typescript
import { EventEmitter } from 'events';
import { BLS } from '../crypto/BLS';
import { Logger } from '../utils/Logger';
import * as crypto from 'crypto';

export interface Attestation {
  slot: number;
  committeeIndex: number;
  beaconBlockRoot: string;
  sourceEpoch: number;
  sourceRoot: string;
  targetEpoch: number;
  targetRoot: string;
  validatorIndex: number;
  signature: string;
  timestamp: number;
}

export interface AggregatedAttestation {
  slot: number;
  committeeIndex: number;
  beaconBlockRoot: string;
  sourceEpoch: number;
  sourceRoot: string;
  targetEpoch: number;
  targetRoot: string;
  aggregationBits: Set<number>;
  aggregateSignature: string;
  committedValidators: number[];
  createdAt: number;
  lastUpdated: number;
}

interface SlotAttestations {
  [committeeIndex: number]: {
    attestations: Map<number, Attestation>;
    aggregated: AggregatedAttestation | null;
  };
}

export class AttestationPool extends EventEmitter {
  private pool: Map<number, SlotAttestations> = new Map();
  private bls: BLS;
  private logger: Logger;
  private maxPoolSize: number;
  private maxSlotsToKeep: number;
  private aggregationInterval: number;
  private cleanupInterval: NodeJS.Timer | null = null;
  private aggregationTimer: NodeJS.Timer | null = null;

  constructor(
    bls: BLS,
    logger: Logger,
    config?: {
      maxPoolSize?: number;
      maxSlotsToKeep?: number;
      aggregationIntervalMs?: number;
    }
  ) {
    super();
    this.bls = bls;
    this.logger = logger;
    this.maxPoolSize = config?.maxPoolSize || 10000;
    this.maxSlotsToKeep = config?.maxSlotsToKeep || 32;
    this.aggregationInterval = config?.aggregationIntervalMs || 8000;
  }

  public start(): void {
    this.cleanupInterval = setInterval(
      () => this.evictOldSlots(),
      this.maxSlotsToKeep * 1000
    );
    this.aggregationTimer = setInterval(
      () => this.performAggregation(),
      this.aggregationInterval
    );
    this.logger.info('AttestationPool started');
  }

  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = null;
    }
    this.pool.clear();
    this.logger.info('AttestationPool stopped');
  }

  public addAttestation(attestation: Attestation): boolean {
    try {
      if (!this.validateAttestation(attestation)) {
        this.logger.warn('Invalid attestation received', {
          slot: attestation.slot,
          validator: attestation.validatorIndex,
        });
        return false;
      }

      const slot = attestation.slot;
      const committeeIndex = attestation.committeeIndex;

      if (!this.pool.has(slot)) {
        this.pool.set(slot, {});
      }

      const slotData = this.pool.get(slot)!;

      if (!slotData[committeeIndex]) {
        slotData[committeeIndex] = {
          attestations: new Map(),
          aggregated: null,
        };
      }

      const existingAttestation = slotData[committeeIndex].attestations.get(
        attestation.validatorIndex
      );

      if (existingAttestation) {
        this.logger.debug('Duplicate attestation from validator', {
          slot,
          validator: attestation.validatorIndex,
        });
        return false;
      }

      slotData[committeeIndex].attestations.set(
        attestation.validatorIndex,
        attestation
      );

      this.checkPoolSize();
      this.emit('attestation:added', { slot, committeeIndex });

      return true;
    } catch (error) {
      this.logger.error('Error adding attestation', { error });
      return false;
    }
  }

  public getAttestationsForSlot(slot: number): Attestation[] {
    const slotData = this.pool.get(slot);
    if (!slotData) {
      return [];
    }

    const attestations: Attestation[] = [];
    Object.values(slotData).forEach((committee) => {
      attestations.push(...committee.attestations.values());
    });

    return attestations;
  }

  public getAggregatedAttestationsForSlot(slot: number): AggregatedAttestation[] {
    const slotData = this.pool.get(slot);
    if (!slotData) {
      return [];
    }

    const aggregated: AggregatedAttestation[] = [];
    Object.values(slotData).forEach((committee) => {
      if (committee.aggregated) {
        aggregated.push(committee.aggregated);
      }
    });

    return aggregated;
  }

  public getPoolSize(): number {
    let size = 0;
    this.pool.forEach((slotData) => {
      Object.values(slotData).forEach((committee) => {
        size += committee.attestations.size;
      });
    });
    return size;
  }

  public getSlotCount(): number {
    return this.pool.size;
  }

  private validateAttestation(attestation: Attestation): boolean {
    if (typeof attestation.slot !== 'number' || attestation.slot < 0) {
      return false;
    }

    if (typeof attestation.committeeIndex !== 'number' || attestation.committeeIndex < 0) {
      return false;
    }

    if (!attestation.beaconBlockRoot || typeof attestation.beaconBlockRoot !== 'string') {
      return false;
    }

    if (!attestation.signature || typeof attestation.signature !== 'string') {
      return false;
    }

    if (typeof attestation.validatorIndex !== 'number' || attestation.validatorIndex < 0) {
      return false;
    }

    if (typeof attestation.timestamp !== 'number' || attestation.timestamp < 0) {
      return false;
    }

    return true;
  }

  private performAggregation(): void {
    try {
      const now = Date.now();
      const slots = Array.from(this.pool.keys()).sort((a, b) => b - a);

      for (const slot of slots.slice(0, Math.max(5, slots.length - 5))) {
        const slotData = this.pool.get(slot);
        if (!slotData) continue;

        Object.entries(slotData).forEach(([committeeIndexStr, committee]) => {
          const committeeIndex = parseInt(committeeIndexStr, 10);

          if (committee.attestations.size === 0) {
            return;
          }

          const attestations = Array.from(committee.attestations.values());

          const grouped = this.groupAttestationsByData(attestations);

          Object.values(grouped).forEach((group) => {
            this.aggregateGroup(slot, committeeIndex, group);
          });
        });
      }
    } catch (error) {
      this.logger.error('Error during attestation aggregation', { error });
    }
  }

  private groupAttestationsByData(
    attestations: Attestation[]
  ): Map<string, Attestation[]> {
    const groups = new Map<string, Attestation[]>();

    attestations.forEach((att) => {
      const key = `${att.beaconBlockRoot}:${att.sourceRoot}:${att.targetRoot}`;

      if