import { AccountStorage } from '../AccountStorage';
import { ContractStorage } from '../contracts/ContractStorage';
import { Transaction } from './transaction';
import { BigNumber } from 'ethers';

class TransactionValidator {
  private accountStorage: AccountStorage;
  private contractStorage: ContractStorage;

  constructor(accountStorage: AccountStorage, contractStorage: ContractStorage) {
    this.accountStorage = accountStorage;
    this.contractStorage = contractStorage;
  }

  validateTransaction(tx: Transaction): boolean {
    // Check account balances
    if (!this.checkAccountBalances(tx)) {
      return false;
    }

    // Check contract state
    if (!this.checkContractState(tx)) {
      return false;
    }

    // Check for potential MEV extraction attempts
    if (this.hasSuspiciousGasCosts(tx)) {
      return false;
    }

    return true;
  }

  private checkAccountBalances(tx: Transaction): boolean {
    // Check sender's balance
    const senderBalance = await this.accountStorage.getBalance(tx.from);
    if (senderBalance.lt(tx.value.add(tx.gasLimit.mul(tx.gasPrice)))) {
      return false;
    }

    // Check recipient's balance (if applicable)
    if (tx.to) {
      const recipientBalance = await this.accountStorage.getBalance(tx.to);
      if (recipientBalance.add(tx.value).gt(BigNumber.from(2).pow(256).sub(1))) {
        return false;
      }
    }

    return true;
  }

  private checkContractState(tx: Transaction): boolean {
    // Check if the transaction is calling a contract
    if (tx.to) {
      // Fetch the contract state
      const contractState = await this.contractStorage.getState(tx.to);

      // Implement logic to check the contract state for validity
      // Return false if the transaction is invalid
      if (contractState.isLocked) {
        return false;
      }
    }

    // Track executed transactions to prevent replays
    if (await this.accountStorage.hasExecutedTransaction(tx.hash)) {
      return false;
    }

    return true;
  }

  private hasSuspiciousGasCosts(tx: Transaction): boolean {
    // Implement logic to detect transactions with excessive gas costs
    // This could indicate an attempt to extract MEV
    if (tx.gasLimit > 10000000) {
      return true;
    }
    return false;
  }
}

export { TransactionValidator };