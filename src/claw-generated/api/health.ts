import { Router, Request, Response } from 'express';
import { BlockManager } from '../BlockManager';
import { TransactionPool } from '../TransactionPool';

const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

healthRouter.get('/ready', (req: Request, res: Response) => {
  // Check if the node is fully synced and ready to process transactions
  const isReady = this.blockManager.isFullySynced() && this.transactionPool.isEmpty();
  res.status(isReady ? 200 : 503).json({ ready: isReady });
});

export default healthRouter;