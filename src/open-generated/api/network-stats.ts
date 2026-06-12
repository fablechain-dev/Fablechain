import { Router } from 'express';
import { BlockManager } from '../BlockManager';
import { PeerManager } from '../PeerManager';
import { Metrics } from '../Metrics';
import { OpenChainState } from '../OpenChainState';

const router = Router();

router.get('/network-stats', async (req, res) => {
  const blockManager = await BlockManager.getInstance();
  const peerManager = await PeerManager.getInstance();
  const openChainState = await OpenChainState.getInstance();

  const tps = Metrics.getTransactionsPerSecond();
  const blockTime = Metrics.getAverageBlockTime();
  const difficulty = await blockManager.getDifficulty();
  const hashrate = await blockManager.getHashrate();
  const activeAddresses = await peerManager.getActiveAddressCount();
  const blockHeight = await openChainState.getBlockHeight();
  const transactionCount = await openChainState.getTransactionCount();
  const totalSupply = await openChainState.getTotalSupply();

  res.json({
    tps,
    blockTime,
    difficulty,
    hashrate,
    activeAddresses,
    blockHeight,
    transactionCount,
    totalSupply
  });
});

export default router;