```typescript
import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { Logger } from '../utils/Logger';
import { ValidationError, ShardingError } from '../errors/CustomErrors';

interface ShardConfig {
  id: string;
  minAddress: string;
  maxAddress: string;
  nodeUrls: string[];
  isActive: boolean;
  capacity: number;
}

interface AccountLocation {
  shardId: string;
  address: string;
  timestamp: number;
}

interface CrossShardTransaction {
  id: string;
  sourceShardId: string;
  targetShardId: string;
  fromAddress: string;
  toAddress: string;
  amount: bigint;
  nonce: number;
  signature: string;
  status: 'pending' | 'committed' | 'failed';
  createdAt: number;
  committedAt?: number;
}

interface ShardingMetrics {
  totalAccounts: number;
  accountsPerShard: Map<string, number>;
  crossShardTransactionsPending: number;
  crossShardTransactionsCommitted: number;
  crossShardTransactionsFailed: number;
  lastRebalanceTime: number;
}

export class ShardRouter extends EventEmitter {
  private shards: Map<string, ShardConfig>;
  private accountLocations: Map<string, AccountLocation>;
  private crossShardTransactions: Map<string, CrossShardTransaction>;
  private logger: Logger;
  private addressPrefixBits: number;
  private metrics: ShardingMetrics;

  constructor(addressPrefixBits: number = 8) {
    super();
    this.shards = new Map();
    this.accountLocations = new Map();
    this.crossShardTransactions = new Map();
    this.logger = new Logger('ShardRouter');
    this.addressPrefixBits = addressPrefixBits;
    this.metrics = {
      totalAccounts: 0,
      accountsPerShard: new Map(),
      crossShardTransactionsPending: 0,
      crossShardTransactionsCommitted: 0,
      crossShardTransactionsFailed: 0,
      lastRebalanceTime: Date.now(),
    };
  }

  public registerShard(config: ShardConfig): void {
    if (this.shards.has(config.id)) {
      throw new ShardingError(`Shard ${config.id} is already registered`);
    }

    if (!this.isValidAddressRange(config.minAddress, config.maxAddress)) {
      throw new ValidationError(
        `Invalid address range for shard ${config.id}`
      );
    }

    this.shards.set(config.id, config);
    this.metrics.accountsPerShard.set(config.id, 0);
    this.logger.info(`Shard ${config.id} registered with range ${config.minAddress} to ${config.maxAddress}`);
    this.emit('shardRegistered', config);
  }

  public getShardForAddress(address: string): string {
    if (!this.isValidAddress(address)) {
      throw new ValidationError(`Invalid address format: ${address}`);
    }

    const prefix = this.extractPrefix(address);
    const shardId = this.findShardByPrefix(prefix);

    if (!shardId) {
      throw new ShardingError(
        `No active shard found for address prefix ${prefix}`
      );
    }

    return shardId;
  }

  public assignAccountToShard(address: string, shardId?: string): AccountLocation {
    if (!this.isValidAddress(address)) {
      throw new ValidationError(`Invalid address format: ${address}`);
    }

    const targetShardId = shardId || this.getShardForAddress(address);
    const shard = this.shards.get(targetShardId);

    if (!shard) {
      throw new ShardingError(`Shard ${targetShardId} does not exist`);
    }

    if (!shard.isActive) {
      throw new ShardingError(`Shard ${targetShardId} is not active`);
    }

    const accountCount = this.metrics.accountsPerShard.get(targetShardId) || 0;
    if (accountCount >= shard.capacity) {
      throw new ShardingError(
        `Shard ${targetShardId} has reached capacity`
      );
    }

    const location: AccountLocation = {
      shardId: targetShardId,
      address,
      timestamp: Date.now(),
    };

    this.accountLocations.set(address, location);
    this.metrics.accountsPerShard.set(
      targetShardId,
      accountCount + 1
    );
    this.metrics.totalAccounts++;

    this.logger.debug(`Account ${address} assigned to shard ${targetShardId}`);
    this.emit('accountAssigned', location);

    return location;
  }

  public getAccountLocation(address: string): AccountLocation {
    const location = this.accountLocations.get(address);

    if (!location) {
      throw new ShardingError(`Account ${address} location not found`);
    }

    return location;
  }

  public routeCrossShardTransaction(
    txId: string,
    fromAddress: string,
    toAddress: string,
    amount: bigint,
    nonce: number,
    signature: string
  ): CrossShardTransaction {
    if (!this.isValidAddress(fromAddress) || !this.isValidAddress(toAddress)) {
      throw new ValidationError('Invalid address in transaction');
    }

    if (amount <= 0n) {
      throw new ValidationError('Transaction amount must be positive');
    }

    const sourceShardId = this.getShardForAddress(fromAddress);
    const targetShardId = this.getShardForAddress(toAddress);

    if (sourceShardId === targetShardId) {
      throw new ValidationError(
        'Addresses belong to the same shard; use intra-shard transaction'
      );
    }

    const transaction: CrossShardTransaction = {
      id: txId,
      sourceShardId,
      targetShardId,
      fromAddress,
      toAddress,
      amount,
      nonce,
      signature,
      status: 'pending',
      createdAt: Date.now(),
    };

    this.crossShardTransactions.set(txId, transaction);
    this.metrics.crossShardTransactionsPending++;

    this.logger.info(
      `Cross-shard transaction ${txId} routed from ${sourceShardId} to ${targetShardId}`
    );
    this.emit('crossShardTransactionRouted', transaction);

    return transaction;
  }

  public commitCrossShardTransaction(txId: string): void {
    const transaction = this.crossShardTransactions.get(txId);

    if (!transaction) {
      throw new ShardingError(`Cross-shard transaction ${txId} not found`);
    }

    if (transaction.status !== 'pending') {
      throw new ShardingError(
        `Transaction ${txId} status is ${transaction.status}, cannot commit`
      );
    }

    transaction.status = 'committed';
    transaction.committedAt = Date.now();
    this.metrics.crossShardTransactionsPending--;
    this.metrics.crossShardTransactionsCommitted++;

    this.logger.info(`Cross-shard transaction ${txId} committed`);
    this.emit('crossShardTransactionCommitted', transaction);
  }

  public failCrossShardTransaction(txId: string, reason: string): void {
    const transaction = this.crossShardTransactions.get(txId);

    if (!transaction) {
      throw new ShardingError(`Cross-shard transaction ${txId} not found`);
    }

    if (transaction.status !== 'pending') {
      throw new ShardingError(
        `Transaction ${txId} status is ${transaction.status}, cannot fail`
      );
    }

    transaction.status = 'failed';
    this.metrics.crossShardTransactionsPending--;
    this.metrics.crossSh