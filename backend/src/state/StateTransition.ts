```typescript
import { Block } from '../blockchain/Block';
import { Transaction } from '../blockchain/Transaction';
import { WorldState } from './WorldState';
import { StateSnapshot } from './StateSnapshot';
import { Logger } from '../utils/Logger';
import {
  StateTransitionError,
  InvalidTransactionError,
  InsufficientBalanceError,
  InvalidNonceError,
  TransactionExecutionError,
} from '../errors/StateErrors';

export interface TransactionResult {
  transactionHash: string;
  success: boolean;
  gasUsed: bigint;
  error?: string;
  stateRoot?: string;
}

export interface BlockTransitionResult {
  blockHash: string;
  success: boolean;
  transactionResults: TransactionResult[];
  finalStateRoot: string;
  totalGasUsed: bigint;
  error?: string;
}

export class StateTransition {
  private worldState: WorldState;
  private logger: Logger;
  private stateSnapshots: Map<string, StateSnapshot>;

  constructor(worldState: WorldState, logger: Logger) {
    this.worldState = worldState;
    this.logger = logger;
    this.stateSnapshots = new Map();
  }

  async applyBlock(block: Block): Promise<BlockTransitionResult> {
    const blockHash = block.hash();
    this.logger.info(`Starting state transition for block ${blockHash}`);

    // Create snapshot before applying any transactions
    const preBlockSnapshot = this.worldState.createSnapshot();
    const snapshotId = `block_${blockHash}`;
    this.stateSnapshots.set(snapshotId, preBlockSnapshot);

    const transactionResults: TransactionResult[] = [];
    let totalGasUsed = 0n;
    let success = true;
    let error: string | undefined;

    try {
      // Validate block structure
      this.validateBlock(block);

      // Process each transaction in the block
      for (const transaction of block.transactions) {
        const txResult = await this.applyTransaction(transaction, block);
        transactionResults.push(txResult);

        if (!txResult.success) {
          this.logger.warn(
            `Transaction ${txResult.transactionHash} failed: ${txResult.error}`
          );
          // Continue processing remaining transactions even if one fails
          success = false;
        }

        totalGasUsed += txResult.gasUsed;
      }

      // Apply block rewards and process miner/validator payments
      await this.applyBlockRewards(block);

      const finalStateRoot = this.worldState.getRootHash();

      return {
        blockHash,
        success,
        transactionResults,
        finalStateRoot,
        totalGasUsed,
      };
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `State transition failed for block ${blockHash}: ${error}`
      );

      // Rollback to pre-block state
      this.rollbackToSnapshot(snapshotId);

      return {
        blockHash,
        success: false,
        transactionResults,
        finalStateRoot: preBlockSnapshot.stateRoot,
        totalGasUsed,
        error,
      };
    }
  }

  private async applyTransaction(
    transaction: Transaction,
    block: Block
  ): Promise<TransactionResult> {
    const txHash = transaction.hash();
    let gasUsed = 0n;

    try {
      // Create transaction-level snapshot for potential rollback
      const txSnapshot = this.worldState.createSnapshot();
      const txSnapshotId = `tx_${txHash}`;
      this.stateSnapshots.set(txSnapshotId, txSnapshot);

      // Validate transaction
      this.validateTransaction(transaction, block);

      // Load sender account
      const senderAddress = transaction.from;
      const senderAccount = this.worldState.getAccount(senderAddress);

      if (!senderAccount) {
        throw new InvalidTransactionError(
          `Sender account ${senderAddress} not found`
        );
      }

      // Validate nonce
      if (transaction.nonce !== senderAccount.nonce) {
        throw new InvalidNonceError(
          `Expected nonce ${senderAccount.nonce}, got ${transaction.nonce}`
        );
      }

      // Calculate transaction cost
      const gasPrice = transaction.gasPrice;
      const txCost = transaction.value + gasPrice * transaction.gasLimit;

      // Validate sender has sufficient balance
      if (senderAccount.balance < txCost) {
        throw new InsufficientBalanceError(
          `Sender balance ${senderAccount.balance} insufficient for transaction cost ${txCost}`
        );
      }

      // Deduct transaction cost from sender
      senderAccount.balance -= txCost;
      senderAccount.nonce += 1n;
      this.worldState.updateAccount(senderAddress, senderAccount);

      // Execute transaction logic based on type
      let executionGasUsed = 0n;

      if (transaction.type === 'TRANSFER') {
        executionGasUsed = await this.executeTransfer(transaction);
      } else if (transaction.type === 'CONTRACT_CREATION') {
        executionGasUsed = await this.executeContractCreation(transaction);
      } else if (transaction.type === 'CONTRACT_CALL') {
        executionGasUsed = await this.executeContractCall(transaction);
      } else {
        throw new TransactionExecutionError(
          `Unknown transaction type: ${transaction.type}`
        );
      }

      // Validate gas used doesn't exceed limit
      if (executionGasUsed > transaction.gasLimit) {
        throw new TransactionExecutionError(
          `Gas used ${executionGasUsed} exceeds limit ${transaction.gasLimit}`
        );
      }

      gasUsed = executionGasUsed;

      // Calculate gas refund
      const gasRefund = (transaction.gasLimit - gasUsed) * gasPrice;
      senderAccount.balance += gasRefund;
      this.worldState.updateAccount(senderAddress, senderAccount);

      this.logger.debug(
        `Transaction ${txHash} applied successfully, gas used: ${gasUsed}`
      );

      return {
        transactionHash: txHash,
        success: true,
        gasUsed,
        stateRoot: this.worldState.getRootHash(),
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Transaction ${txHash} execution failed: ${error}`);

      // Rollback transaction state
      const txSnapshotId = `tx_${txHash}`;
      this.rollbackToSnapshot(txSnapshotId);

      return {
        transactionHash: txHash,
        success: false,
        gasUsed,
        error,
      };
    }
  }

  private async executeTransfer(transaction: Transaction): Promise<bigint> {
    const baseGas = 21000n;

    if (!transaction.to) {
      throw new TransactionExecutionError('Transfer requires recipient address');
    }

    // Load or create recipient account
    let recipientAccount = this.worldState.getAccount(transaction.to);
    if (!recipientAccount) {
      recipientAccount = {
        address: transaction.to,
        balance: 0n,
        nonce: 0n,
        codeHash: '',
        storageRoot: '',
      };
    }

    recipientAccount.balance += transaction.value;
    this.worldState.updateAccount(transaction.to, recipientAccount);

    return baseGas;
  }

  private async executeContractCreation(
    transaction: Transaction
  ): Promise<bigint> {
    const baseGas = 53000n;
    const codeSize = transaction.data ? transaction.data.length : 0;
    const codeSizeGas = BigInt(codeSize) * 200n;

    if (!transaction.data || transaction.data.length === 0) {
      throw new TransactionExecutionError(
        'Contract creation requires bytecode'
      );
    }

    const contractAddress = this.deriveContractAddress(
      transaction.