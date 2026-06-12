import express from 'express';
import { getNetworkStats } from '../rpc/network_stats';

const router = express.Router();

// Existing routes...

router.get('/network/stats', getNetworkStats);

export default router;