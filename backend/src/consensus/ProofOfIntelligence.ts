```typescript
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { ValidatorSet } from '../types/ValidatorSet';
import { Block } from '../types/Block';
import { Transaction } from '../types/Transaction';

interface ValidatorInfo {
  address: string;
  stake: bigint;
  intelligenceScore: number;
  lastProposalBlock: number;
  slashingPenalty: bigint;
  isActive: boolean;
}

interface RoundState {
  roundNumber: number;
  proposer: string;
  validators: ValidatorInfo[];
  quorumSize: number;
  startHeight: number;
  endHeight: number;
  timeout: number;
  commitments: Map<string, string>;
  votes: Map<string, number>;
  createdAt: number;
}

interface PoIConfig {
  minValidators: number;
  maxValidators: number;
  blockTime: number;
  roundDuration: number;
  minQuorumPercentage: number;
  intelligenceDecayFactor: number;
  slashingPercentage: bigint;
  rotationInterval: number;
  minStake: bigint;
}

export class ProofOfIntelligence extends EventEmitter {
  private config: PoIConfig;
  private logger: Logger;
  private currentRound: RoundState | null = null;
  private validatorSet: Map<string, ValidatorInfo> = new Map();
  private roundHistory: Map<number, RoundState> = new Map();
  private lastRotationHeight: number = 0;
  private accumulatedScore: Map<string, number> = new Map();
  private blockCommitments: Map<number, string> = new Map();
  private sealed: boolean = false;

  constructor(config: PoIConfig, logger: Logger) {
    super();
    this.config = {
      minValidators: 4,
      maxValidators: 100,
      blockTime: 4000,
      roundDuration: 20000,
      minQuorumPercentage: 66,
      intelligenceDecayFactor: 0.98,
      slashingPercentage: 5n,
      rotationInterval: 1000,
      minStake: 100000000000000000n,
      ...config,
    };
    this.logger = logger;
  }

  public initializeValidators(validators: ValidatorInfo[]): void {
    if (this.sealed) {
      throw new Error('ProofOfIntelligence already sealed for genesis');
    }

    if (validators.length < this.config.minValidators) {
      throw new Error(
        `Minimum ${this.config.minValidators} validators required`
      );
    }

    if (validators.length > this.config.maxValidators) {
      throw new Error(
        `Maximum ${this.config.maxValidators} validators allowed`
      );
    }

    validators.forEach((validator) => {
      if (validator.stake < this.config.minStake) {
        throw new Error(
          `Validator ${validator.address} stake below minimum requirement`
        );
      }
      this.validatorSet.set(validator.address, {
        ...validator,
        intelligenceScore: 1000,
        lastProposalBlock: 0,
        slashingPenalty: 0n,
        isActive: true,
      });
      this.accumulatedScore.set(validator.address, 1000);
    });

    this.logger.info(
      `Initialized ${validators.length} validators for Proof of Intelligence`
    );
  }

  public sealGenesis(): void {
    if (this.sealed) {
      throw new Error('Genesis already sealed');
    }
    this.sealed = true;
    this.startNewRound(0);
    this.logger.info('Proof of Intelligence genesis sealed');
  }

  public startNewRound(blockHeight: number): void {
    if (!this.sealed) {
      throw new Error('Genesis not sealed');
    }

    const roundNumber = Math.floor(blockHeight / this.config.blockTime);
    const activeValidators = Array.from(this.validatorSet.values()).filter(
      (v) => v.isActive && v.slashingPenalty < v.stake
    );

    if (activeValidators.length === 0) {
      throw new Error('No active validators available');
    }

    const proposer = this.selectProposer(roundNumber, activeValidators);
    const quorumSize = this.calculateQuorum(activeValidators.length);

    this.currentRound = {
      roundNumber,
      proposer,
      validators: activeValidators,
      quorumSize,
      startHeight: blockHeight,
      endHeight: blockHeight + this.config.blockTime,
      timeout: Date.now() + this.config.roundDuration,
      commitments: new Map(),
      votes: new Map(),
      createdAt: Date.now(),
    };

    this.roundHistory.set(roundNumber, this.currentRound);
    this.emit('roundStarted', {
      round: roundNumber,
      proposer,
      quorumSize,
      validatorCount: activeValidators.length,
    });

    this.logger.debug(
      `Started round ${roundNumber} with proposer ${proposer.substring(0, 8)}`
    );
  }

  private selectProposer(
    roundNumber: number,
    validators: ValidatorInfo[]
  ): string {
    const seed = Buffer.from(
      roundNumber.toString() +
        this.currentRound?.createdAt.toString() +
        'fablechain-poi'
    );
    const hash = crypto.createHash('sha256').update(seed).digest();
    const index = hash.readUInt32BE(0) % validators.length;

    const weighted = this.selectWeightedValidator(validators, index);
    return weighted.address;
  }

  private selectWeightedValidator(
    validators: ValidatorInfo[],
    seed: number
  ): ValidatorInfo {
    const totalScore = validators.reduce(
      (sum, v) => sum + v.intelligenceScore,
      0
    );

    if (totalScore === 0) {
      return validators[seed % validators.length];
    }

    let random = (seed * 7919) % totalScore;
    let accumulated = 0;

    for (const validator of validators) {
      accumulated += validator.intelligenceScore;
      if (random < accumulated) {
        return validator;
      }
    }

    return validators[validators.length - 1];
  }

  private calculateQuorum(validatorCount: number): number {
    return Math.ceil((validatorCount * this.config.minQuorumPercentage) / 100);
  }

  public submitCommitment(validatorAddress: string, blockHash: string): void {
    if (!this.currentRound) {
      throw new Error('No active round');
    }

    if (!this.validatorSet.has(validatorAddress)) {
      throw new Error('Validator not registered');
    }

    const validator = this.validatorSet.get(validatorAddress)!;
    if (!validator.isActive) {
      throw new Error('Validator is inactive');
    }

    if (Date.now() > this.currentRound.timeout) {
      throw new Error('Round timeout exceeded');
    }

    const commitment = this.hashCommitment(validatorAddress, blockHash);
    this.currentRound.commitments.set(validatorAddress, commitment);

    this.emit('commitmentReceived', {
      validator: validatorAddress,
      round: this.currentRound.roundNumber,
      timestamp: Date.now(),
    });

    this.logger.debug(
      `Commitment received from ${validatorAddress.substring(0, 8)}`
    );
  }

  public recordVote(validatorAddress: string, blockHash: string): boolean {
    if (!this.currentRound) {
      throw new Error('No active round');
    }

    if (!this.currentRound.commitments.has(validatorAddress)) {
      throw new Error('Validator has not committed');
    }