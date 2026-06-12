import { Router } from 'express';
import { sendTransaction } from './transactions';
import RateLimiter from './rate-limiter';
import WebSocketServer from './websocket';
import { BlockManager } from '../BlockManager';
import { TransactionPool } from '../TransactionPool';
import healthRouter from './health';

const router = Router();
const rateLimiter = new RateLimiter();
const blockManager = new BlockManager(/* dependencies */);
const transactionPool = new TransactionPool(/* dependencies */);
const webSocketServer = new WebSocketServer(blockManager, transactionPool);

router.use(rateLimiter.middleware);

router.use(healthRouter);
router.post('/transactions', sendTransaction);

export default router;