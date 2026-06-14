```typescript
import { EventEmitter } from 'events';
import { createHash } from 'crypto';

interface ValidatorInfo {
  address: string;
  stakedAmount: bigint;
  votingPower: bigint;
  isActive: boolean;
  joinedAtBlock: number;
  slashEvents: SlashEvent[];
  commissionRate: number;
  delegators: Map<string, bigint>;
}

interface SlashEvent {
  timestamp: number;
  reason: string;
  penaltyPercentage: number;
  amountSlashed: bigint;
  evidence: string;
}

interface DelegationInfo {
  delegator: string;
  validator: string;
  amount: bigint;
  delegatedAtBlock: number;
}

export class ValidatorRegistry extends EventEmitter {
  private validators: Map<string, ValidatorInfo>;
  private delegations: Map<string, DelegationInfo[]>;
  private totalVotingPower: bigint;
  private minStakeAmount: bigint;
  private slashingParams: {
    doubleSignPenalty: number;
    downtimePenalty: number;
    maxSlashPercentage: number;
  };
  private currentBlock: number;
  private consensusThreshold: number;
  private maxValidators: number;
  private delegationLocks: Map<string, number>;

  constructor(
    minStakeAmount: bigint = BigInt('1000000000000000000'),
    maxValidators: number = 128,
    consensusThreshold: number = 0.66
  ) {
    super();
    this.validators = new Map();
    this.delegations = new Map();
    this.delegationLocks = new Map();
    this.totalVotingPower = BigInt(0);
    this.minStakeAmount = minStakeAmount;
    this.maxValidators = maxValidators;
    this.consensusThreshold = consensusThreshold;
    this.currentBlock = 0;
    this.slashingParams = {
      doubleSignPenalty: 0.05,
      downtimePenalty: 0.001,
      maxSlashPercentage: 0.5,
    };
  }

  public registerValidator(
    address: string,
    stakedAmount: bigint,
    commissionRate: number = 0.05
  ): boolean {
    if (this.validators.has(address)) {
      throw new Error(`Validator ${address} is already registered`);
    }

    if (stakedAmount < this.minStakeAmount) {
      throw new Error(
        `Staked amount ${stakedAmount} is below minimum requirement ${this.minStakeAmount}`
      );
    }

    if (commissionRate < 0 || commissionRate > 0.5) {
      throw new Error('Commission rate must be between 0 and 50%');
    }

    if (this.validators.size >= this.maxValidators) {
      throw new Error(
        `Maximum number of validators (${this.maxValidators}) reached`
      );
    }

    const votingPower = this.computeVotingPower(stakedAmount);
    const validator: ValidatorInfo = {
      address,
      stakedAmount,
      votingPower,
      isActive: true,
      joinedAtBlock: this.currentBlock,
      slashEvents: [],
      commissionRate,
      delegators: new Map(),
    };

    this.validators.set(address, validator);
    this.totalVotingPower += votingPower;

    this.emit('ValidatorRegistered', {
      address,
      stakedAmount,
      votingPower,
      timestamp: Date.now(),
      blockNumber: this.currentBlock,
    });

    return true;
  }

  public deregisterValidator(address: string): boolean {
    const validator = this.validators.get(address);

    if (!validator) {
      throw new Error(`Validator ${address} not found`);
    }

    if (!validator.isActive) {
      throw new Error(`Validator ${address} is not active`);
    }

    this.totalVotingPower -= validator.votingPower;
    validator.isActive = false;

    const delegationKey = this.getDelegationKey(address);
    this.delegations.delete(delegationKey);
    this.delegationLocks.delete(delegationKey);

    this.emit('ValidatorDeregistered', {
      address,
      unbondingAmount: validator.stakedAmount,
      timestamp: Date.now(),
      blockNumber: this.currentBlock,
    });

    return true;
  }

  public delegate(
    delegator: string,
    validator: string,
    amount: bigint
  ): boolean {
    const validatorInfo = this.validators.get(validator);

    if (!validatorInfo) {
      throw new Error(`Validator ${validator} not found`);
    }

    if (!validatorInfo.isActive) {
      throw new Error(`Validator ${validator} is not active`);
    }

    if (amount <= BigInt(0)) {
      throw new Error('Delegation amount must be positive');
    }

    const delegationKey = this.getDelegationKey(validator);
    let delegationList = this.delegations.get(delegationKey) || [];

    const existingDelegation = delegationList.find(
      (d) => d.delegator === delegator
    );

    if (existingDelegation) {
      existingDelegation.amount += amount;
    } else {
      delegationList.push({
        delegator,
        validator,
        amount,
        delegatedAtBlock: this.currentBlock,
      });
    }

    this.delegations.set(delegationKey, delegationList);
    validatorInfo.delegators.set(delegator, amount);

    const newStakedAmount =
      validatorInfo.stakedAmount + amount;
    const oldVotingPower = validatorInfo.votingPower;
    const newVotingPower = this.computeVotingPower(newStakedAmount);

    this.totalVotingPower = this.totalVotingPower - oldVotingPower + newVotingPower;
    validatorInfo.stakedAmount = newStakedAmount;
    validatorInfo.votingPower = newVotingPower;

    this.emit('DelegationAdded', {
      delegator,
      validator,
      amount,
      newVotingPower,
      timestamp: Date.now(),
      blockNumber: this.currentBlock,
    });

    return true;
  }

  public undelegate(
    delegator: string,
    validator: string,
    amount: bigint
  ): boolean {
    const validatorInfo = this.validators.get(validator);

    if (!validatorInfo) {
      throw new Error(`Validator ${validator} not found`);
    }

    const delegationKey = this.getDelegationKey(validator);
    const delegationList = this.delegations.get(delegationKey) || [];

    const delegationIndex = delegationList.findIndex(
      (d) => d.delegator === delegator
    );

    if (delegationIndex === -1) {
      throw new Error(`No delegation found from ${delegator} to ${validator}`);
    }

    const delegation = delegationList[delegationIndex];

    if (delegation.amount < amount) {
      throw new Error(
        `Undelegation amount exceeds delegated amount: ${amount} > ${delegation.amount}`
      );
    }

    delegation.amount -= amount;

    if (delegation.amount === BigInt(0)) {
      delegationList.splice(delegationIndex, 1);
    }

    this.delegations.set(delegationKey, delegationList);

    const delegatedTotal =
      Array.from(validatorInfo.delegators.values()).reduce(
        (sum, amt) => sum + amt,
        BigInt(0)
      ) - amount;
    validatorInfo.delegators.set(
      delegator,
      validatorInfo.delegators.get(delegator)! - amount
    );

    const newStakedAmount = validatorInfo.stakedAmount - amount;
    const oldV