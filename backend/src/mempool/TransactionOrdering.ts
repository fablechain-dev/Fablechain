```typescript
import { Transaction } from '../types/Transaction';
import { TransactionPool } from './TransactionPool';
import { Logger } from '../logger/Logger';

export interface TransactionWithFee extends Transaction {
  feePerGas: bigint;
  totalFee: bigint;
}

export interface SenderNonceTracker {
  address: string;
  currentNonce: number;
  pendingTransactions: Map<number, TransactionWithFee>;
}

export interface OrderingResult {
  ordered: TransactionWithFee[];
  rejected: Array<{
    transaction: TransactionWithFee;
    reason: string;
  }>;
}

export class TransactionOrdering {
  private logger: Logger;
  private transactionPool: TransactionPool;
  private senderTrackers: Map<string, SenderNonceTracker> = new Map();

  constructor(transactionPool: TransactionPool, logger: Logger) {
    this.transactionPool = transactionPool;
    this.logger = logger;
  }

  /**
   * Order transactions for block inclusion, maximizing fee revenue while maintaining
   * nonce ordering per sender. Uses a greedy algorithm with heap-based selection.
   */
  public orderTransactionsForBlock(
    maxBlockSize: number,
    currentBlockNumber: number,
    gasLimit: bigint
  ): OrderingResult {
    const transactions = this.transactionPool.getAllTransactions();
    const enrichedTxs = this.enrichTransactionsWithFees(transactions);
    const rejected: Array<{ transaction: TransactionWithFee; reason: string }> = [];

    // Initialize sender trackers with current nonces
    this.initializeSenderTrackers(enrichedTxs, currentBlockNumber);

    const ordered: TransactionWithFee[] = [];
    let usedGas = 0n;
    let processedCount = 0;

    // Priority queue: transactions ordered by fee per gas (descending), then by nonce
    const priorityQueue = this.buildPriorityQueue(enrichedTxs);

    while (priorityQueue.length > 0 && processedCount < maxBlockSize) {
      const tx = priorityQueue.shift();
      if (!tx) break;

      const senderTracker = this.senderTrackers.get(tx.from);
      if (!senderTracker) {
        rejected.push({
          transaction: tx,
          reason: 'Sender tracker not found',
        });
        continue;
      }

      // Check if this transaction can be included based on nonce ordering
      const nextExpectedNonce = senderTracker.currentNonce;
      if (tx.nonce < nextExpectedNonce) {
        rejected.push({
          transaction: tx,
          reason: `Nonce too low: expected ${nextExpectedNonce}, got ${tx.nonce}`,
        });
        continue;
      }

      if (tx.nonce > nextExpectedNonce) {
        // Gap in nonce sequence; skip this and try next from queue
        senderTracker.pendingTransactions.set(tx.nonce, tx);
        continue;
      }

      // Check gas limit
      if (usedGas + BigInt(tx.gasLimit) > gasLimit) {
        rejected.push({
          transaction: tx,
          reason: `Block gas limit exceeded: ${usedGas + BigInt(tx.gasLimit)} > ${gasLimit}`,
        });
        continue;
      }

      // Include transaction in block
      ordered.push(tx);
      usedGas += BigInt(tx.gasLimit);
      senderTracker.currentNonce = tx.nonce + 1;
      processedCount++;

      // Check if there's a next transaction from this sender queued
      this.includeQueuedTransactionsForSender(
        senderTracker,
        ordered,
        usedGas,
        gasLimit,
        maxBlockSize,
        processedCount,
        rejected
      );
    }

    // Log ordering results
    this.logger.debug(
      `Transaction ordering complete: ${ordered.length} included, ${rejected.length} rejected`,
      {
        usedGas: usedGas.toString(),
        gasLimit: gasLimit.toString(),
        blockSpace: `${processedCount}/${maxBlockSize}`,
      }
    );

    return { ordered, rejected };
  }

  /**
   * Build a priority queue of transactions ordered by fee efficiency and nonce
   */
  private buildPriorityQueue(transactions: TransactionWithFee[]): TransactionWithFee[] {
    return transactions.sort((a, b) => {
      // Primary: sort by fee per gas (descending)
      if (a.feePerGas !== b.feePerGas) {
        return a.feePerGas > b.feePerGas ? -1 : 1;
      }

      // Secondary: sort by total fee (descending)
      if (a.totalFee !== b.totalFee) {
        return a.totalFee > b.totalFee ? -1 : 1;
      }

      // Tertiary: sort by nonce (ascending) for same sender
      if (a.from === b.from) {
        return a.nonce - b.nonce;
      }

      // Final: stable sort by transaction hash
      return a.hash.localeCompare(b.hash);
    });
  }

  /**
   * Enrich transactions with calculated fees
   */
  private enrichTransactionsWithFees(transactions: Transaction[]): TransactionWithFee[] {
    return transactions.map((tx) => {
      const gasLimit = BigInt(tx.gasLimit);
      const gasPrice = BigInt(tx.gasPrice);
      const totalFee = gasLimit * gasPrice;
      const feePerGas = gasPrice;

      return {
        ...tx,
        feePerGas,
        totalFee,
      };
    });
  }

  /**
   * Initialize sender nonce trackers from blockchain state
   */
  private initializeSenderTrackers(
    transactions: TransactionWithFee[],
    currentBlockNumber: number
  ): void {
    this.senderTrackers.clear();

    // Group transactions by sender
    const senderTxMap = new Map<string, TransactionWithFee[]>();
    for (const tx of transactions) {
      if (!senderTxMap.has(tx.from)) {
        senderTxMap.set(tx.from, []);
      }
      senderTxMap.get(tx.from)!.push(tx);
    }

    // Initialize tracker for each sender
    for (const [sender, senderTxs] of senderTxMap.entries()) {
      const pendingMap = new Map<number, TransactionWithFee>();
      for (const tx of senderTxs) {
        pendingMap.set(tx.nonce, tx);
      }

      // In production, currentNonce would be fetched from chain state
      // Here we use a placeholder that should be replaced with actual state query
      const startingNonce = this.getAccountNonce(sender, currentBlockNumber);

      this.senderTrackers.set(sender, {
        address: sender,
        currentNonce: startingNonce,
        pendingTransactions: pendingMap,
      });
    }
  }

  /**
   * Include all queued transactions for a sender that now have valid nonces
   */
  private includeQueuedTransactionsForSender(
    tracker: SenderNonceTracker,
    ordered: TransactionWithFee[],
    usedGas: bigint,
    gasLimit: bigint,
    maxBlockSize: number,
    processedCount: number,
    rejected: Array<{ transaction: TransactionWithFee; reason: string }>
  ): void {
    let nextNonce = tracker.currentNonce;

    while (tracker.pendingTransactions.has(nextNonce)) {
      const tx = tracker.pendingTransactions.get(nextNonce)!;
      tracker.pendingTransactions.delete(nextNonce);

      if (processedCount >= maxBlockSize) {
        rejected.push({
          transaction: tx,
          reason: 'Block is full',
        });
        return;
      }

      if (used