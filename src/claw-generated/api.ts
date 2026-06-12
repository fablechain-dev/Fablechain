import express from 'express';
import { faucetEndpoint } from './faucet';

const router = express.Router();

router.post('/faucet', faucetEndpoint);

export default router;