import express from 'express';
import { faucetHandler } from './faucet';
import { healthHandler, readyHandler } from './health';

const router = express.Router();

router.get('/faucet', faucetHandler);
router.get('/health', healthHandler);
router.get('/ready', readyHandler);

export default router;