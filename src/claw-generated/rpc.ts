import { Account } from './account';
import { Transaction } from './transaction';
import { TransactionHistory } from './transaction-history';

export class RpcService {
  private accounts: { [address: string]: Account } = {};
  private transactionHistories: { [address: string]: TransactionHistory } = {};

  getAccountBalance(address: string): number {
    if (!this.accounts[address]) {
      this.accounts[address] = new Account();
    }
    return this.accounts[address].getBalance();
  }

  getTransactionHistory(address: string): Transaction[] {
    if (!this.transactionHistories[address]) {
      this.transactionHistories[address] = new TransactionHistory();
    }
    return this.transactionHistories[address].getTransactions();
  }

  getPendingTransactions(address: string): Transaction[] {
    if (!this.transactionHistories[address]) {
      this.transactionHistories[address] = new TransactionHistory();
    }
    return this.transactionHistories[address].getPendingTransactions();
  }

  getConfirmedTransactions(address: string): Transaction[] {
    if (!this.transactionHistories[address]) {
      this.transactionHistories[address] = new TransactionHistory();
    }
    return this.transactionHistories[address].getConfirmedTransactions();
  }
}