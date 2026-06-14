```typescript
import { EventEmitter } from 'events';
import crypto from 'crypto';

export interface ValidatorInfo {
  address: string;
  publicKey: string;
  stake: bigint;
  reputation: number;
  lastProposalRound: number;
  intelligenceScore: number;
  isActive: boolean;
  joinedAt: number;
}

export interface RoundInfo {
  roundNumber: number;
  startTime: number;
  endTime: number;
  proposer: string;
  quorumSize: number;
  validators: string[];
  blockHash?: string;
  sealed: boolean;
}

export interface ConsensusConfig {
  minValidators: number;
  maxValidators: number;
  roundDuration: number;
  quorumPercentage: number;
  minStakeRequired: bigint;
  reputationDecayRate: number;
  intelligenceWeightage: number;
  maxValidatorsPerRound: number;
  rotationInterval: number;
}

export class ProofOfIntelligence extends EventEmitter {
  private validators: Map<string, ValidatorInfo>;
  private currentRound: RoundInfo;
  private roundHistory: Map<number, RoundInfo>;
  private config: ConsensusConfig;
  private roundTimer: NodeJS.Timeout | null = null;
  private validatorRotationSchedule: Map<number, string[]>;
  private intelligenceCache: Map<string, number>;
  private lastRotationRound: number = 0;

  constructor(config: ConsensusConfig) {
    super();
    this.config = config;
    this.validators = new Map();
    this.roundHistory = new Map();
    this.validatorRotationSchedule = new Map();
    this.intelligenceCache = new Map();

    this.currentRound = {
      roundNumber: 0,
      startTime: Date.now(),
      endTime: Date.now() + config.roundDuration,
      proposer: '',
      quorumSize: 0,
      validators: [],
      sealed: false,
    };

    this.initializeConsensus();
  }

  private initializeConsensus(): void {
    this.emit('consensus:initialized', {
      config: this.config,
      timestamp: Date.now(),
    });
  }

  public registerValidator(
    address: string,
    publicKey: string,
    stake: bigint,
  ): void {
    if (this.validators.has(address)) {
      throw new Error(`Validator ${address} already registered`);
    }

    if (stake < this.config.minStakeRequired) {
      throw new Error(
        `Stake ${stake} below minimum required ${this.config.minStakeRequired}`,
      );
    }

    const validator: ValidatorInfo = {
      address,
      publicKey,
      stake,
      reputation: 100,
      lastProposalRound: -1,
      intelligenceScore: 50,
      isActive: true,
      joinedAt: Date.now(),
    };

    this.validators.set(address, validator);
    this.intelligenceCache.set(address, 50);

    this.emit('validator:registered', {
      address,
      stake: stake.toString(),
      timestamp: Date.now(),
    });
  }

  public removeValidator(address: string): void {
    const validator = this.validators.get(address);
    if (!validator) {
      throw new Error(`Validator ${address} not found`);
    }

    validator.isActive = false;
    this.validators.set(address, validator);

    this.emit('validator:removed', {
      address,
      timestamp: Date.now(),
    });
  }

  public updateValidatorReputation(
    address: string,
    delta: number,
  ): void {
    const validator = this.validators.get(address);
    if (!validator) {
      throw new Error(`Validator ${address} not found`);
    }

    const oldReputation = validator.reputation;
    validator.reputation = Math.max(0, Math.min(100, validator.reputation + delta));
    this.validators.set(address, validator);

    this.emit('validator:reputation:updated', {
      address,
      oldReputation,
      newReputation: validator.reputation,
      delta,
      timestamp: Date.now(),
    });
  }

  public updateIntelligenceScore(
    address: string,
    score: number,
  ): void {
    const validator = this.validators.get(address);
    if (!validator) {
      throw new Error(`Validator ${address} not found`);
    }

    if (score < 0 || score > 100) {
      throw new Error('Intelligence score must be between 0 and 100');
    }

    const oldScore = validator.intelligenceScore;
    validator.intelligenceScore = score;
    this.intelligenceCache.set(address, score);
    this.validators.set(address, validator);

    this.emit('validator:intelligence:updated', {
      address,
      oldScore,
      newScore: score,
      timestamp: Date.now(),
    });
  }

  private calculateValidatorWeight(validator: ValidatorInfo): number {
    const stakeWeight = Number(validator.stake) / 1e18;
    const reputationWeight = (validator.reputation / 100) * this.config.intelligenceWeightage;
    const intelligenceWeight =
      (validator.intelligenceScore / 100) * this.config.intelligenceWeightage;

    return stakeWeight + reputationWeight + intelligenceWeight;
  }

  private selectValidatorsForRound(): string[] {
    const activeValidators = Array.from(this.validators.values()).filter(
      (v) => v.isActive,
    );

    if (activeValidators.length < this.config.minValidators) {
      throw new Error(
        `Insufficient validators: ${activeValidators.length} < ${this.config.minValidators}`,
      );
    }

    const weighted = activeValidators.map((validator) => ({
      address: validator.address,
      weight: this.calculateValidatorWeight(validator),
    }));

    weighted.sort((a, b) => b.weight - a.weight);

    const selectedCount = Math.min(
      weighted.length,
      this.config.maxValidatorsPerRound,
    );

    return weighted.slice(0, selectedCount).map((w) => w.address);
  }

  private selectProposer(validators: string[]): string {
    if (validators.length === 0) {
      throw new Error('Cannot select proposer from empty validator set');
    }

    let totalWeight = 0;
    const weights = validators.map((address) => {
      const validator = this.validators.get(address);
      if (!validator) {
        throw new Error(`Validator ${address} not found`);
      }
      const weight = this.calculateValidatorWeight(validator);
      totalWeight += weight;
      return weight;
    });

    let randomValue = crypto.randomBytes(32).readUInt32BE(0) % totalWeight;

    for (let i = 0; i < validators.length; i++) {
      randomValue -= weights[i];
      if (randomValue <= 0) {
        return validators[i];
      }
    }

    return validators[validators.length - 1];
  }

  public calculateQuorum(): number {
    const activeValidators = Array.from(this.validators.values()).filter(
      (v) => v.isActive,
    ).length;

    if (activeValidators === 0) {
      return 0;
    }

    const quorum = Math.ceil(
      (activeValidators * this.config.quorumPercentage) / 100,
    );

    return Math.max(1, quorum);
  }

  public scheduleNextRound(): RoundInfo {
    const validators = this.selectValidatorsForRound();
    const proposer = this.selectProposer(validators);
    const quorum = this.calculateQuorum();

    const roundNumber = this.currentRound.roundNumber + 1;
    const startTime = Date.now();
    const endTime = startTime + this.config.roundDuration;