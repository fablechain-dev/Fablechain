import { getBlockchainInfo, getActiveAddresses } from '../networking/rpcClient';

export const getTransactionRate = async (): Promise<number> => {
  const { transactionsPerSecond } = await getBlockchainInfo();
  return transactionsPerSecond;
};

export const getAverageBlockTime = async (): Promise<number> => {
  const { averageBlockTime } = await getBlockchainInfo();
  return averageBlockTime;
};

export const getMiningDifficulty = async (): Promise<number> => {
  const { difficulty } = await getBlockchainInfo();
  return difficulty;
};

export const getNetworkHashrate = async (): Promise<number> => {
  const { networkHashrate } = await getBlockchainInfo();
  return networkHashrate;
};

export const getActiveAddresses = async (): Promise<number> => {
  return await getActiveAddresses();
};