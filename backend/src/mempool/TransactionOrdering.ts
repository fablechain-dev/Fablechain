import { Transaction } from '../types/Transaction';
import { Logger } from '../utils/Logger';

interface TransactionWithFee extends Transaction {
  feePerGas: bigint;
  feeRevenue: bigint;
}

interface SenderQueue {
  transactions: TransactionWithFee[];
  nextNonce: bigint;
}

interface OrderingResult {
  ordered: TransactionWithFee[];
  excluded: TransactionWithFee[];
}

export class TransactionOrdering {
  private logger: Logger;
  private maxBlockSize: number;
  private minGasPrice: bigint;

  constructor(
    logger: Logger,
    maxBlockSize: number = 30000000,
    minGasPrice: bigint = BigInt(1)
  ) {
    this.logger = logger;
    this.maxBlockSize = maxBlockSize;
    this.minGasPrice = minGasPrice;
  }

  /**
   * Orders transactions to maximize fee revenue while respecting nonce ordering.
   * Uses a greedy algorithm with per-sender nonce validation.
   */
  public orderTransactions(transactions: Transaction[]): OrderingResult {
    const validatedTxs = this.validateAndEnrichTransactions(transactions);
    const senderQueues = this.groupBySender(validatedTxs);
    
    return this.greedyOrdering(senderQueues);
  }

  /**
   * Validates transactions and calculates fee metrics
   */
  private validateAndEnrichTransactions(
    transactions: Transaction[]
  ): TransactionWithFee[] {
    const enriched: TransactionWithFee[] = [];

    for (const tx of transactions) {
      if (!this.isValidTransaction(tx)) {
        this.logger.debug(`Skipping invalid transaction: ${tx.hash}`);
        continue;
      }

      const feePerGas = tx.gasPrice || this.minGasPrice;
      const feeRevenue = feePerGas * BigInt(tx.gasLimit);

      enriched.push({
        ...tx,
        feePerGas,
        feeRevenue,
      });
    }

    return enriched;
  }

  /**
   * Validates basic transaction properties
   */
  private isValidTransaction(tx: Transaction): boolean {
    if (!tx.hash || !tx.from || !tx.gasLimit) {
      return false;
    }

    if (typeof tx.nonce !== 'bigint' || tx.nonce < 0n) {
      return false;
    }

    if (typeof tx.gasPrice !== 'bigint' && tx.gasPrice !== undefined) {
      return false;
    }

    if (tx.gasPrice && tx.gasPrice < this.minGasPrice) {
      return false;
    }

    return true;
  }

  /**
   * Groups transactions by sender address with nonce ordering
   */
  private groupBySender(txs: TransactionWithFee[]): Map<string, SenderQueue> {
    const queues = new Map<string, SenderQueue>();

    for (const tx of txs) {
      const sender = tx.from.toLowerCase();

      if (!queues.has(sender)) {
        queues.set(sender, {
          transactions: [],
          nextNonce: 0n,
        });
      }

      const queue = queues.get(sender)!;
      queue.transactions.push(tx);
    }

    // Sort each sender's transactions by nonce
    for (const queue of queues.values()) {
      queue.transactions.sort((a, b) =>
        Number(a.nonce - b.nonce)
      );
    }

    return queues;
  }

  /**
   * Performs greedy ordering: selects highest-fee transactions that respect nonce ordering
   */
  private greedyOrdering(
    senderQueues: Map<string, SenderQueue>
  ): OrderingResult {
    const ordered: TransactionWithFee[] = [];
    const excluded: TransactionWithFee[] = [];
    let blockSize = 0;

    // Create a heap of candidateTransactions (highest fee first)
    const candidates = this.buildCandidateHeap(senderQueues);

    while (candidates.length > 0) {
      const candidate = candidates.shift()!;
      const txSize = candidate.gasLimit;

      // Check if transaction fits in block
      if (blockSize + txSize > this.maxBlockSize) {
        excluded.push(candidate);
        continue;
      }

      // Check nonce ordering for sender
      const queue = senderQueues.get(candidate.from.toLowerCase());
      if (!queue || candidate.nonce !== queue.nextNonce) {
        excluded.push(candidate);
        continue;
      }

      // Transaction is valid and fits
      ordered.push(candidate);
      blockSize += txSize;
      queue.nextNonce += 1n;

      // Add next transaction from same sender if available
      const senderNextTx = this.getNextValidTransaction(queue);
      if (senderNextTx) {
        this.insertIntoHeap(candidates, senderNextTx);
      }
    }

    // Collect remaining excluded transactions
    for (const queue of senderQueues.values()) {
      for (const tx of queue.transactions) {
        if (!ordered.includes(tx) && !excluded.includes(tx)) {
          excluded.push(tx);
        }
      }
    }

    this.logger.info(
      `Ordered ${ordered.length} transactions, ` +
      `excluded ${excluded.length}, block size: ${blockSize}/${this.maxBlockSize}`
    );

    return { ordered, excluded };
  }

  /**
   * Builds initial candidate heap sorted by fee (highest first)
   */
  private buildCandidateHeap(
    senderQueues: Map<string, SenderQueue>
  ): TransactionWithFee[] {
    const candidates: TransactionWithFee[] = [];

    for (const queue of senderQueues.values()) {
      const firstTx = queue.transactions[0];
      if (firstTx && firstTx.nonce === 0n) {
        candidates.push(firstTx);
      }
    }

    // Sort by fee descending
    candidates.sort((a, b) =>
      Number(b.feeRevenue - a.feeRevenue)
    );

    return candidates;
  }

  /**
   * Gets next valid transaction from sender queue (respecting nonce)
   */
  private getNextValidTransaction(queue: SenderQueue): TransactionWithFee | null {
    for (const tx of queue.transactions) {
      if (tx.nonce === queue.nextNonce) {
        return tx;
      }
    }
    return null;
  }

  /**
   * Inserts transaction into heap maintaining fee-descending order
   */
  private insertIntoHeap(heap: TransactionWithFee[], tx: TransactionWithFee): void {
    heap.push(tx);
    heap.sort((a, b) => Number(b.feeRevenue - a.feeRevenue));
  }

  /**
   * Calculates total fee revenue from ordered transactions
   */
  public calculateTotalFeeRevenue(txs: TransactionWithFee[]): bigint {
    return txs.reduce((sum, tx) => sum + tx.feeRevenue, 0n);
  }

  /**
   * Validates that ordering respects all nonce constraints
   */
  public validateOrdering(
    ordered: TransactionWithFee[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const nonceBySender = new Map<string, bigint>();

    for (const tx of ordered) {
      const sender = tx.from.toLowerCase();
      const expectedNonce = nonceBySender.get(sender) ?? 0n;

      if (tx.nonce !== expectedNonce) {
        errors.push(
          `Nonce violation for ${sender}: expected ${expectedNonce}, got ${tx.nonce}`
        );
      }

      nonceBySender.set(sender, expectedNonce + 1n);
    }

    return {
      valid: errors.length === 0,
      errors,