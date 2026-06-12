import { Request, Response } from 'express';
import { OPEN } from '../token/OPEN';
import rateLimit from 'express-rate-limit';

// Create a rate limiter
const faucetLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP, please try again after 1 minute'
});

export async function faucetHandler(req: Request, res: Response) {
  // Apply the rate limiter
  await faucetLimiter(req, res, async () => {
    // TODO: Implement faucet logic
    res.status(200).json({ message: 'Faucet endpoint' });
  });
}