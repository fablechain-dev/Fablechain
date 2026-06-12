import { Request } from 'express';

class RateLimiter {
  private requestCount: Map<string, number> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  shouldAllow(req: Request): boolean {
    const key = this.getKey(req);
    const currentCount = this.requestCount.get(key) || 0;

    if (currentCount >= this.maxRequests) {
      return false;
    }

    this.requestCount.set(key, currentCount + 1);

    // Clean up expired requests
    this.requestCount.forEach((count, k) => {
      if (count > 0 && this.getTimeSinceLastRequest(k) > this.windowMs) {
        this.requestCount.set(k, 0);
      }
    });

    return true;
  }

  private getKey(req: Request): string {
    return `${req.ip}:${req.headers['x-api-key'] || 'no-api-key'}`;
  }

  private getTimeSinceLastRequest(key: string): number {
    return new Date().getTime() - (this.requestCount.get(key) || 0);
  }
}

export { RateLimiter };