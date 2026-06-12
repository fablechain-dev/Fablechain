import { getBlockchain } from './blockchain';

export const getBlockchainMetrics = async (): Promise<{
  transactionCount: number;
  blockTime: number;
  difficulty: number;
  hashrate: number;
  activeAddresses: number;
}> => {
  const blockchain = await getBlockchain();

  const transactionCount = blockchain.getTransactionCount();
  const blockTime = blockchain.getAverageBlockTime();
  const difficulty = blockchain.getDifficulty();
  const hashrate = blockchain.getHashrate();
  const activeAddresses = blockchain.getActiveAddresses();

  return {
    transactionCount,
    blockTime,
    difficulty,
    hashrate,
    activeAddresses
  };
};