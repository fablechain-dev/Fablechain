import { getBlockchainMetrics } from '../blockchain/metrics';

export const getTransactionCount = async (): Promise<number> => {
  const { transactionCount } = await getBlockchainMetrics();
  return transactionCount;
};

export const getBlockTime = async (): Promise<number> => {
  const { blockTime } = await getBlockchainMetrics();
  return blockTime;
};

export const getDifficulty = async (): Promise<number> => {
  const { difficulty } = await getBlockchainMetrics();
  return difficulty;
};

export const getHashrate = async (): Promise<number> => {
  const { hashrate } = await getBlockchainMetrics();
  return hashrate;
};

export const getActiveAddresses = async (): Promise<number> => {
  const { activeAddresses } = await getBlockchainMetrics();
  return activeAddresses;
};