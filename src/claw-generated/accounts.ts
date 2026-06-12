import { getBalance, getTransactions, getTokenBalances } from '../services/blockchain';

export async function getAccountBalance(address: string): Promise<number> {
  return await getBalance(address);
}

export async function getTransactionHistory(address: string): Promise<any[]> {
  const transactions = await getTransactions(address);
  return transactions.map(tx => ({
    date: tx.timestamp,
    type: tx.type,
    amount: tx.amount
  }));
}

export async function getTokenHoldings(address: string): Promise<any[]> {
  const tokenBalances = await getTokenBalances(address);
  return tokenBalances.map(balance => ({
    name: balance.token.name,
    balance: balance.amount
  }));
}