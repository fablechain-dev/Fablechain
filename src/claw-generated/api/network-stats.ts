import { Router } from 'express';
import { BlockManager } from '../BlockManager';
import { PeerManager } from '../PeerManager';
import { Metrics } from '../Metrics';

const router = Router();

router.get('/network-stats', async (req, res) => {
  const blockManager = await BlockManager.getInstance();
  const peerManager = await PeerManager.getInstance();

  const tps = Metrics.getTransactionsPerSecond();
  const blockTime = Metrics.getAverageBlockTime();
  const difficulty = await blockManager.getDifficulty();
  const hashrate = await blockManager.getHashrate();
  const activeAddresses = await peerManager.getActiveAddressCount();

  res.json({
    tps,
    blockTime,
    difficulty,
    hashrate,
    activeAddresses
  });
});

export default router;