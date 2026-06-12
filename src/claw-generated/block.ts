import { Request, Response } from 'express';
import { Block } from '../core/Block';

const blockLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again after 1 minute'
});

export async function getBlockHandler(req: Request, res: Response) {
  await blockLimiter(req, res, async () => {
    // TODO: Implement block retrieval logic
    res.status(200).json({ message: 'Block endpoint' });
  });
}