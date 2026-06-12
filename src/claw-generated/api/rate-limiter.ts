import { Request, Response, NextFunction } from 'express';

interface RequestCounter {
  count: number;
  lastTimestamp: number;
}

class RateLimiter {
  private readonly windowMs: number = 60 * 1000; // 1 minute window
  private readonly maxRequests: number = 100; // 100 requests per minute
  private readonly requestCounters: Map<string, RequestCounter> = new Map();

  public middleware = (req: Request, res: Response, next: NextFunction) => {
    const key = this.getRequestKey(req);
    const counter = this.requestCounters.get(key) || { count: 0, lastTimestamp: 0 };
    const now = Date.now();

    // Clear the counter if the window has expired
    if (now - counter.lastTimestamp > this.windowMs) {
      counter.count = 0;
      counter.lastTimestamp = now;
    }

    // Increment the counter and check if the limit has been reached
    counter.count++;
    this.requestCounters.set(key, counter);
    if (counter.count > this.maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    next();
  };

  private getRequestKey(req: Request): string {
    return `${req.ip}:${req.headers['x-api-key'] || 'unknown'}`;
  }
}

export default RateLimiter;