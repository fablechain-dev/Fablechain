```typescript
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { BLSSignature, BLSPublicKey, Attestation, AttestationData } from '../types/consensus';
import { BLSAggregate } from '../crypto/BLSAggregate';
import { Config } from '../config/Config';

interface AggregatedAttestation {
  data: AttestationData;
  aggregateSignature: BLSSignature;
  aggregatePublicKey: BLSPublicKey;
  participatingValidators: Set<number>;
  timestamp: number;
}

interface SlotAttestations {
  slot: number;
  attestations: Map<string, Attestation>;
  aggregated: Map<string, AggregatedAttestation>;
  lastUpdated: number;
}

export class AttestationPool extends EventEmitter {
  private slots: Map<number, SlotAttestations> = new Map();
  private logger: Logger;
  private config: Config;
  private maxSlotsRetained: number;
  private attestationCleanupInterval: NodeJS.Timer | null = null;
  private maxAttestationsPerData: number;

  constructor(config: Config, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.maxSlotsRetained = config.attestation.maxSlotsRetained || 32;
    this.maxAttestationsPerData = config.attestation.maxAttestationsPerData || 1024;
    
    this.startCleanupTimer();
  }

  /**
   * Add an attestation to the pool
   */
  public addAttestation(attestation: Attestation): boolean {
    if (!this.validateAttestation(attestation)) {
      this.logger.warn('Invalid attestation rejected', { 
        slot: attestation.data.slot,
        validator: attestation.validatorIndex
      });
      return false;
    }

    const slot = attestation.data.slot;
    let slotData = this.slots.get(slot);

    if (!slotData) {
      slotData = {
        slot,
        attestations: new Map(),
        aggregated: new Map(),
        lastUpdated: Date.now()
      };
      this.slots.set(slot, slotData);
    }

    const key = this.generateAttestationKey(attestation);
    
    if (slotData.attestations.size >= this.maxAttestationsPerData) {
      this.logger.debug('Attestation pool limit reached for slot', { slot });
      return false;
    }

    slotData.attestations.set(key, attestation);
    slotData.lastUpdated = Date.now();

    this.aggregateForSlot(slot, attestation.data);
    this.emit('attestationAdded', { slot, validator: attestation.validatorIndex });

    return true;
  }

  /**
   * Add multiple attestations in batch
   */
  public addAttestations(attestations: Attestation[]): { added: number; rejected: number } {
    let added = 0;
    let rejected = 0;

    for (const attestation of attestations) {
      if (this.addAttestation(attestation)) {
        added++;
      } else {
        rejected++;
      }
    }

    if (rejected > 0) {
      this.logger.debug('Batch attestation processing completed', { added, rejected });
    }

    return { added, rejected };
  }

  /**
   * Get aggregated attestations for a specific slot and shard
   */
  public getAggregatedAttestations(slot: number, shardCommitment: string): AggregatedAttestation | null {
    const slotData = this.slots.get(slot);
    if (!slotData) {
      return null;
    }

    return slotData.aggregated.get(shardCommitment) || null;
  }

  /**
   * Get all aggregated attestations for a slot
   */
  public getAllAggregatedForSlot(slot: number): AggregatedAttestation[] {
    const slotData = this.slots.get(slot);
    if (!slotData) {
      return [];
    }

    return Array.from(slotData.aggregated.values());
  }

  /**
   * Get count of attestations in pool
   */
  public getAttestationCount(): number {
    let total = 0;
    for (const slotData of this.slots.values()) {
      total += slotData.attestations.size;
    }
    return total;
  }

  /**
   * Get slots currently in the pool
   */
  public getSlots(): number[] {
    return Array.from(this.slots.keys()).sort((a, b) => b - a);
  }

  /**
   * Remove attestations for a slot (after processing)
   */
  public removeSlot(slot: number): boolean {
    if (this.slots.has(slot)) {
      this.slots.delete(slot);
      this.logger.debug('Slot attestations removed', { slot });
      return true;
    }
    return false;
  }

  /**
   * Prune old slots beyond retention window
   */
  public pruneOldSlots(currentSlot: number): number {
    const minSlot = currentSlot - this.maxSlotsRetained;
    let prunedCount = 0;

    for (const slot of this.slots.keys()) {
      if (slot < minSlot) {
        this.slots.delete(slot);
        prunedCount++;
      }
    }

    if (prunedCount > 0) {
      this.logger.debug('Pruned old attestation slots', { 
        count: prunedCount, 
        minSlot,
        remainingSlots: this.slots.size 
      });
    }

    return prunedCount;
  }

  /**
   * Clear entire pool (useful for testing or state resets)
   */
  public clear(): void {
    this.slots.clear();
    this.logger.info('Attestation pool cleared');
  }

  /**
   * Validate an attestation before adding to pool
   */
  private validateAttestation(attestation: Attestation): boolean {
    // Check basic structure
    if (!attestation.data || attestation.signature === undefined || attestation.validatorIndex === undefined) {
      return false;
    }

    // Check signature format (basic length check)
    if (typeof attestation.signature !== 'string' || attestation.signature.length === 0) {
      return false;
    }

    // Check validator index is non-negative
    if (attestation.validatorIndex < 0) {
      return false;
    }

    // Check attestation data validity
    if (!this.validateAttestationData(attestation.data)) {
      return false;
    }

    return true;
  }

  /**
   * Validate attestation data structure
   */
  private validateAttestationData(data: AttestationData): boolean {
    if (data.slot === undefined || data.slot < 0) {
      return false;
    }

    if (!data.beaconBlockRoot || data.beaconBlockRoot.length === 0) {
      return false;
    }

    if (data.source === undefined || data.target === undefined) {
      return false;
    }

    return true;
  }

  /**
   * Generate unique key for attestation deduplication
   */
  private generateAttestationKey(attestation: Attestation): string {
    return `${attestation.validatorIndex}:${attestation.signature}`;
  }

  /**
   * Aggregate BLS signatures for matching attestation data
   */
  private aggregateForSlot(slot: number, attestationData: AttestationData): void {
    const slotData = this.slots.get(slot);
    if (!slotData) {
      return;
    }

    const dataKey = this.generateDataKey(attestationData);
    const matching: Attestation[] = [];
    const validatorSet = new Set<number>();

    // Collect all attestations matching this data