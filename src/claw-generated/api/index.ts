import { Router } from 'express';
import { sendTransaction } from './transactions';
import RateLimiter from './rate-limiter';

const router = Router();
const rateLimiter = new RateLimiter();

router.use(rateLimiter.middleware);

router.post('/transactions', sendTransaction);

export default router;