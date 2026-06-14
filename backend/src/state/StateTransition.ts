```typescript
import { Block } from '../types/Block';
import { Transaction } from '../types/Transaction';
import { WorldState } from './WorldState';
import { StateSnapshot } from './StateSnapshot';
import { TransactionValidator } from '../validation/TransactionValidator';
import { Account } from '../types/Account';
import { Logger } from '../utils/Logger';

interface TransitionResult {
  success: boolean;
  blockHash: string;
  appliedTransactions: string[];
  failedTransactions: Array<{
    txHash: string;
    reason: string;
  }>;
  stateRoot: string;
  gasUsed: bigint;
  timestamp: number;
}

interface TransitionContext {
  block: Block;
  worldState: WorldState;
  validator: TransactionValidator;
  logger: Logger;
  maxGasPerBlock: bigint;
}

class StateTransitionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'StateTransitionError';
  }
}

export class StateTransition {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  async applyBlock(context: TransitionContext): Promise<TransitionResult> {
    const startTime = Date.now();
    const snapshot = context.worldState.createSnapshot();
    
    const result: TransitionResult = {
      success: false,
      blockHash: context.block.hash,
      appliedTransactions: [],
      failedTransactions: [],
      stateRoot: '',
      gasUsed: 0n,
      timestamp: startTime,
    };

    try {
      this.logger.debug(`[StateTransition] Starting block transition for block ${context.block.hash}`);

      // Validate block structure and metadata
      this.validateBlockStructure(context.block);

      let cumulativeGasUsed = 0n;
      const transactionCount = context.block.transactions.length;

      for (let i = 0; i < transactionCount; i++) {
        const transaction = context.block.transactions[i];

        try {
          // Pre-transaction validation
          if (!context.validator.isValid(transaction)) {
            throw new StateTransitionError(
              `Transaction validation failed: ${transaction.hash}`,
              'VALIDATION_FAILED'
            );
          }

          // Gas limit check
          const estimatedGas = this.estimateTransactionGas(transaction);
          if (cumulativeGasUsed + estimatedGas > context.maxGasPerBlock) {
            throw new StateTransitionError(
              `Block gas limit exceeded at transaction ${i}`,
              'GAS_LIMIT_EXCEEDED',
              { cumulativeGasUsed, estimatedGas, maxGas: context.maxGasPerBlock }
            );
          }

          // Apply transaction to world state
          const txResult = await this.applyTransaction(transaction, context.worldState);
          
          cumulativeGasUsed += txResult.gasUsed;
          result.appliedTransactions.push(transaction.hash);

          this.logger.debug(`[StateTransition] Applied transaction ${transaction.hash}, gas used: ${txResult.gasUsed}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          result.failedTransactions.push({
            txHash: transaction.hash,
            reason: errorMessage,
          });

          this.logger.warn(
            `[StateTransition] Transaction ${transaction.hash} failed: ${errorMessage}`
          );

          // Continue with next transaction instead of halting
          // This follows Ethereum's approach of including failed transactions in blocks
        }
      }

      // Finalize state changes
      result.gasUsed = cumulativeGasUsed;
      result.stateRoot = context.worldState.getStateRoot();
      result.success = true;

      this.logger.info(
        `[StateTransition] Block transition completed successfully. ` +
        `Applied: ${result.appliedTransactions.length}, ` +
        `Failed: ${result.failedTransactions.length}, ` +
        `Gas used: ${cumulativeGasUsed}`
      );

      return result;
    } catch (error) {
      this.logger.error(
        `[StateTransition] Critical error during block transition: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );

      // Rollback on critical failure
      try {
        context.worldState.rollbackToSnapshot(snapshot);
        this.logger.info(`[StateTransition] State rolled back to snapshot`);
      } catch (rollbackError) {
        this.logger.error(
          `[StateTransition] Failed to rollback state: ${
            rollbackError instanceof Error ? rollbackError.message : 'Unknown error'
          }`
        );
      }

      return result;
    }
  }

  private async applyTransaction(
    transaction: Transaction,
    worldState: WorldState
  ): Promise<{ gasUsed: bigint; success: boolean }> {
    const sender = worldState.getAccount(transaction.from);
    
    if (!sender) {
      throw new StateTransitionError(
        `Sender account not found: ${transaction.from}`,
        'ACCOUNT_NOT_FOUND'
      );
    }

    // Validate sender has sufficient balance
    const transactionCost = transaction.value + (transaction.gasPrice * transaction.gasLimit);
    if (sender.balance < transactionCost) {
      throw new StateTransitionError(
        `Insufficient balance for transaction. Required: ${transactionCost}, Available: ${sender.balance}`,
        'INSUFFICIENT_BALANCE'
      );
    }

    // Deduct transaction cost from sender
    const updatedSender: Account = {
      ...sender,
      balance: sender.balance - transactionCost,
      nonce: sender.nonce + 1n,
    };
    worldState.updateAccount(transaction.from, updatedSender);

    // Process transaction based on type
    let gasUsed = 21000n; // Base transaction cost

    if (transaction.type === 'transfer') {
      gasUsed += this.processTransfer(transaction, worldState);
    } else if (transaction.type === 'contract_call') {
      gasUsed += await this.processContractCall(transaction, worldState);
    } else if (transaction.type === 'contract_deploy') {
      gasUsed += await this.processContractDeploy(transaction, worldState);
    } else {
      throw new StateTransitionError(
        `Unknown transaction type: ${transaction.type}`,
        'UNKNOWN_TRANSACTION_TYPE'
      );
    }

    // Calculate refund (unused gas)
    const gasRefund = (transaction.gasLimit - gasUsed) * transaction.gasPrice;
    if (gasRefund > 0n) {
      const refundedSender = worldState.getAccount(transaction.from);
      if (refundedSender) {
        worldState.updateAccount(transaction.from, {
          ...refundedSender,
          balance: refundedSender.balance + gasRefund,
        });
      }
    }

    return { gasUsed, success: true };
  }

  private processTransfer(transaction: Transaction, worldState: WorldState): bigint {
    const recipient = worldState.getAccount(transaction.to);
    
    if (!recipient) {
      throw new StateTransitionError(
        `Recipient account not found: ${transaction.to}`,
        'RECIPIENT_NOT_FOUND'
      );
    }

    const updatedRecipient: Account = {
      ...recipient,
      balance: recipient.balance + transaction.value,
    };
    worldState.updateAccount(transaction.to, updatedRecipient);

    return 0n; // No additional gas beyond base cost
  }

  private async processContractCall(
    transaction: Transaction,
    worldState: WorldState
  ): Promise<bigint> {
    if (!transaction.to) {
      throw new StateTransitionError(
        'Contract call requires recipient address',
        'INVALID_CONTRACT_CALL'
      );