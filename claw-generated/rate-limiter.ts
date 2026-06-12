import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Rate limit config
const MAX_REQUESTS = 100; // Max requests per window
const WINDOW_MS = 60 * 1000; // 1 minute window

// Create a rate limiter
const limiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again after 1 minute',
  keyGenerator: (req: Request) => {
    // Key by both IP address and API key
    return `${req.ip}:${req.get('X-API-Key') || 'no-api-key'}`;
  }
});

// Middleware to apply rate limiting
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  return limiter(req, res, next);
};