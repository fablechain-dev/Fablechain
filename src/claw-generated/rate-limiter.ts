import { Request, Response, NextFunction } from 'express';
import { ApiKey } from './auth';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultRateLimit: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 60  // 60 requests per minute
};

// In-memory store for rate limit buckets
const rateLimitBuckets: Map<string, { count: number; resetAt: number }> = new Map();

// Check rate limit for a key or IP
function checkRateLimit(identifier: string, limit: number = defaultRateLimit.maxRequests): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(identifier);

  if (!bucket || now > bucket.resetAt) {
    // Create or reset bucket
    rateLimitBuckets.set(identifier, {
      count: 1,
      resetAt: now + defaultRateLimit.windowMs
    });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count++;
  return true;
}

// Get remaining rate limit
function getRateLimitRemaining(identifier: string, limit: number = defaultRateLimit.maxRequests): number {
  const bucket = rateLimitBuckets.get(identifier);
  if (!bucket || Date.now() > bucket.resetAt) {
    return limit;
  }
  return Math.max(0, limit - bucket.count);
}

// API key-based rate limiting middleware
export function apiKeyRateLimit(apiKey: ApiKey) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!checkRateLimit(apiKey.id, apiKey.rateLimit)) {
      const remaining = getRateLimitRemaining(apiKey.id, apiKey.rateLimit);
      res.set('X-RateLimit-Limit', apiKey.rateLimit.toString());
      res.set('X-RateLimit-Remaining', remaining.toString());
      res.set('X-RateLimit-Reset', Math.ceil((rateLimitBuckets.get(apiKey.id)?.resetAt || 0) / 1000).toString());
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(defaultRateLimit.windowMs / 1000)
      });
    }

    next();
  };
}

// IP-based rate limiting middleware (for unauthenticated requests)
export function ipRateLimit(maxRequests: number = 30) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!checkRateLimit(`ip:${ip}`, maxRequests)) {
      const remaining = getRateLimitRemaining(`ip:${ip}`, maxRequests);
      res.set('X-RateLimit-Limit', maxRequests.toString());
      res.set('X-RateLimit-Remaining', remaining.toString());
      res.set('X-RateLimit-Reset', Math.ceil((rateLimitBuckets.get(`ip:${ip}`)?.resetAt || 0) / 1000).toString());
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(defaultRateLimit.windowMs / 1000)
      });
    }

    next();
  };
}