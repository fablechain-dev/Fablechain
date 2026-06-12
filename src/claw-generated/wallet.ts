import { ChainState } from '../api/chain-state';

export class WalletAPI {
  static async getAccountBalance(address: string): Promise<number> {
    const chainState = new ChainState();
    return await chainState.getBalance(address);
  }

  static async getTransactionHistory(address: string): Promise<Transaction[]> {
    const chainState = new ChainState();
    return await chainState.getTransactions(address);
  }
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  confirmed: boolean;
}