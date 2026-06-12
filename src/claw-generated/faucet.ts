import { Request, Response } from 'express';
import { CLAW } from '../token/CLAW';
import { RateLimiter } from './rate_limiter';

const rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

export async function faucetHandler(req: Request, res: Response) {
  if (!rateLimiter.shouldAllow(req)) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  // TODO: Implement faucet logic
  res.status(200).json({ message: 'Faucet endpoint' });
}