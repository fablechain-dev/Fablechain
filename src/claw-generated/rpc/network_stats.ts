import { Request, Response } from 'express';
import { getTransactionCount, getBlockTime, getDifficulty, getHashrate, getActiveAddresses } from '../services/network-stats';

export const getNetworkStats = async (req: Request, res: Response) => {
  try {
    const tps = await getTransactionCount();
    const blockTime = await getBlockTime();
    const difficulty = await getDifficulty();
    const hashrate = await getHashrate();
    const activeAddresses = await getActiveAddresses();

    res.json({
      tps,
      blockTime,
      difficulty,
      hashrate,
      activeAddresses
    });
  } catch (error) {
    console.error('Error getting network stats:', error);
    res.status(500).json({ error: 'Error fetching network stats' });
  }
};