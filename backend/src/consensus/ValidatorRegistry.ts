```typescript
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { ValidationError, InsufficientStakeError, ValidatorNotFoundError } from '../errors/CustomErrors';

export interface ValidatorInfo {
  address: string;
  stakedAmount: bigint;
  votingPower: bigint;
  jailedUntil: number;
  commissionRate: number;
  lastHeartbeat: number;
  delegators: Map<string, bigint>;
  totalDelegated: bigint;
  slashCount: number;
  isActive: boolean;
}

export interface SlashingEvent {
  validatorAddress: string;
  reason: string;
  slashAmount: bigint;
  timestamp: number;
  evidence: string;
}

export interface DelegationInfo {
  delegator: string;
  amount: bigint;
  shares: bigint;
}

export class ValidatorRegistry extends EventEmitter {
  private validators: Map<string, ValidatorInfo>;
  private slashingHistory: SlashingEvent[];
  private logger: Logger;
  private minStakeRequired: bigint;
  private maxValidators: number;
  private slashingRate: number;
  private unbondingPeriod: number;
  private jailingDuration: number;
  private votingPowerScale: bigint;

  constructor(config: {
    minStakeRequired?: bigint;
    maxValidators?: number;
    slashingRate?: number;
    unbondingPeriod?: number;
    jailingDuration?: number;
  } = {}) {
    super();
    this.validators = new Map();
    this.slashingHistory = [];
    this.logger = new Logger('ValidatorRegistry');
    
    this.minStakeRequired = config.minStakeRequired || BigInt(1000) * BigInt(10) ** BigInt(18);
    this.maxValidators = config.maxValidators || 100;
    this.slashingRate = config.slashingRate || 0.05;
    this.unbondingPeriod = config.unbondingPeriod || 604800;
    this.jailingDuration = config.jailingDuration || 86400;
    this.votingPowerScale = BigInt(10) ** BigInt(18);
  }

  public registerValidator(
    address: string,
    stakedAmount: bigint,
    commissionRate: number
  ): ValidatorInfo {
    if (!this.isValidAddress(address)) {
      throw new ValidationError('Invalid validator address format');
    }

    if (this.validators.has(address)) {
      throw new ValidationError(`Validator ${address} is already registered`);
    }

    if (stakedAmount < this.minStakeRequired) {
      throw new InsufficientStakeError(
        `Minimum stake of ${this.minStakeRequired.toString()} required, got ${stakedAmount.toString()}`
      );
    }

    if (this.validators.size >= this.maxValidators) {
      throw new ValidationError('Maximum validator limit reached');
    }

    if (commissionRate < 0 || commissionRate > 1) {
      throw new ValidationError('Commission rate must be between 0 and 1');
    }

    const votingPower = this.calculateVotingPower(stakedAmount);

    const validator: ValidatorInfo = {
      address,
      stakedAmount,
      votingPower,
      jailedUntil: 0,
      commissionRate,
      lastHeartbeat: Date.now(),
      delegators: new Map(),
      totalDelegated: BigInt(0),
      slashCount: 0,
      isActive: true,
    };

    this.validators.set(address, validator);
    this.logger.info(`Validator registered: ${address} with stake: ${stakedAmount.toString()}`);
    this.emit('validatorRegistered', { address, stakedAmount, votingPower });

    return validator;
  }

  public deregisterValidator(address: string): void {
    const validator = this.getValidator(address);

    if (!validator.isActive) {
      throw new ValidationError(`Validator ${address} is not active`);
    }

    validator.isActive = false;
    this.updateValidatorVotingPower(address);

    this.logger.info(`Validator deregistered: ${address}`);
    this.emit('validatorDeregistered', { address });
  }

  public delegate(delegatorAddress: string, validatorAddress: string, amount: bigint): DelegationInfo {
    if (!this.isValidAddress(delegatorAddress) || !this.isValidAddress(validatorAddress)) {
      throw new ValidationError('Invalid address format');
    }

    if (amount <= BigInt(0)) {
      throw new ValidationError('Delegation amount must be positive');
    }

    const validator = this.getValidator(validatorAddress);

    if (validator.jailedUntil > Date.now()) {
      throw new ValidationError(`Validator ${validatorAddress} is currently jailed`);
    }

    const currentDelegation = validator.delegators.get(delegatorAddress) || BigInt(0);
    const newDelegation = currentDelegation + amount;
    validator.delegators.set(delegatorAddress, newDelegation);
    validator.totalDelegated += amount;

    this.updateValidatorVotingPower(validatorAddress);

    const shares = this.calculateShares(amount, validator.totalDelegated);

    this.logger.info(
      `Delegation: ${delegatorAddress} delegated ${amount.toString()} to ${validatorAddress}`
    );
    this.emit('delegationCreated', { delegatorAddress, validatorAddress, amount });

    return { delegator: delegatorAddress, amount, shares };
  }

  public undelegate(delegatorAddress: string, validatorAddress: string, amount: bigint): void {
    const validator = this.getValidator(validatorAddress);

    const currentDelegation = validator.delegators.get(delegatorAddress);
    if (!currentDelegation || currentDelegation < amount) {
      throw new ValidationError(
        `Insufficient delegation balance for ${delegatorAddress} in validator ${validatorAddress}`
      );
    }

    const newDelegation = currentDelegation - amount;
    if (newDelegation === BigInt(0)) {
      validator.delegators.delete(delegatorAddress);
    } else {
      validator.delegators.set(delegatorAddress, newDelegation);
    }

    validator.totalDelegated -= amount;
    this.updateValidatorVotingPower(validatorAddress);

    this.logger.info(
      `Undelegation: ${delegatorAddress} undelegated ${amount.toString()} from ${validatorAddress}`
    );
    this.emit('undelegationCreated', { delegatorAddress, validatorAddress, amount });
  }

  public slash(validatorAddress: string, reason: string, evidence: string): SlashingEvent {
    const validator = this.getValidator(validatorAddress);

    const slashAmount = (validator.stakedAmount * BigInt(Math.floor(this.slashingRate * 100))) /
      BigInt(100);

    if (validator.stakedAmount < slashAmount) {
      throw new ValidationError(
        `Insufficient staked amount to slash for validator ${validatorAddress}`
      );
    }

    validator.stakedAmount -= slashAmount;
    validator.slashCount += 1;

    const slashingEvent: SlashingEvent = {
      validatorAddress,
      reason,
      slashAmount,
      timestamp: Date.now(),
      evidence,
    };

    this.slashingHistory.push(slashingEvent);
    this.updateValidatorVotingPower(validatorAddress);

    this.logger.warn(
      `Validator slashed: ${validatorAddress}, Amount: ${slashAmount.toString()}, Reason: ${reason}`
    );
    this.emit('validatorSlashed', slashingEvent);

    if (validator.slashCount >= 3) {
      this.jailValidator(validatorAddress, `Accumulated ${validator.slashCount} slashes`);
    }

    return slashingEvent