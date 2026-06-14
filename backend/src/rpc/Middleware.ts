```typescript
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import winston from 'winston';
import crypto from 'crypto';

interface RateLimitConfig {
  points: number;
  duration: number;
}

interface MiddlewareConfig {
  enableRateLimit: boolean;
  enableLogging: boolean;
  enableMethodAllowlist: boolean;
  rateLimitConfig: RateLimitConfig;
  allowedMethods: Set<string>;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface RpcRequest extends Request {
  body: {
    jsonrpc: string;
    method: string;
    params?: unknown[];
    id: string | number | null;
  };
  clientIp?: string;
  requestId?: string;
}

interface RpcResponse {
  jsonrpc: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number | null;
}

class RpcMiddleware {
  private rateLimiter: RateLimiterMemory;
  private logger: winston.Logger;
  private config: MiddlewareConfig;
  private requestMetrics: Map<string, RequestMetric> = new Map();

  interface RequestMetric {
    count: number;
    totalDuration: number;
    lastAccessed: number;
  }

  constructor(config: Partial<MiddlewareConfig> = {}) {
    this.config = {
      enableRateLimit: config.enableRateLimit ?? true,
      enableLogging: config.enableLogging ?? true,
      enableMethodAllowlist: config.enableMethodAllowlist ?? true,
      rateLimitConfig: config.rateLimitConfig ?? { points: 100, duration: 60 },
      allowedMethods: config.allowedMethods ?? this.getDefaultAllowedMethods(),
      logLevel: config.logLevel ?? 'info',
    };

    this.rateLimiter = new RateLimiterMemory({
      points: this.config.rateLimitConfig.points,
      duration: this.config.rateLimitConfig.duration,
      blockDurationMs: 60000,
    });

    this.logger = winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'rpc-middleware' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/rpc-error.log',
          level: 'error',
          maxsize: 10485760,
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/rpc-combined.log',
          maxsize: 10485760,
          maxFiles: 10,
        }),
      ],
    });
  }

  private getDefaultAllowedMethods(): Set<string> {
    return new Set([
      'web3_clientVersion',
      'web3_sha3',
      'net_listening',
      'net_peerCount',
      'net_version',
      'eth_blockNumber',
      'eth_call',
      'eth_chainId',
      'eth_gasPrice',
      'eth_getBalance',
      'eth_getBlockByHash',
      'eth_getBlockByNumber',
      'eth_getCode',
      'eth_getTransactionByHash',
      'eth_sendRawTransaction',
      'eth_estimateGas',
      'eth_getTransactionCount',
      'eth_getTransactionReceipt',
      'eth_getLogs',
      'eth_subscribe',
      'eth_unsubscribe',
    ]);
  }

  private extractClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  private generateRequestId(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private updateMetrics(method: string, duration: number): void {
    const existing = this.requestMetrics.get(method) || {
      count: 0,
      totalDuration: 0,
      lastAccessed: 0,
    };

    existing.count++;
    existing.totalDuration += duration;
    existing.lastAccessed = Date.now();

    this.requestMetrics.set(method, existing);
  }

  public requestLogger() {
    return (req: RpcRequest, res: Response, next: NextFunction): void => {
      if (!this.config.enableLogging) {
        next();
        return;
      }

      const startTime = Date.now();
      req.clientIp = this.extractClientIp(req);
      req.requestId = this.generateRequestId();

      const method = req.body?.method || 'unknown';
      const params = req.body?.params ? JSON.stringify(req.body.params) : 'none';

      this.logger.debug('RPC request received', {
        requestId: req.requestId,
        clientIp: req.clientIp,
        method,
        params,
        userAgent: req.headers['user-agent'],
      });

      const originalJson = res.json.bind(res);
      res.json = (data: RpcResponse | RpcResponse[]): Response => {
        const duration = Date.now() - startTime;
        const isArray = Array.isArray(data);
        const responses = isArray ? data : [data];

        responses.forEach((response) => {
          const hasError = !!response.error;
          const logLevel = hasError ? 'warn' : 'debug';

          this.logger.log(logLevel, 'RPC response sent', {
            requestId: req.requestId,
            clientIp: req.clientIp,
            method,
            duration: `${duration}ms`,
            hasError,
            errorCode: response.error?.code,
            errorMessage: response.error?.message,
          });

          this.updateMetrics(method, duration);
        });

        return originalJson(data);
      };

      next();
    };
  }

  public rateLimitMiddleware() {
    return async (
      req: RpcRequest,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      if (!this.config.enableRateLimit) {
        next();
        return;
      }

      const clientIp = req.clientIp || this.extractClientIp(req);
      const key = `${clientIp}`;

      try {
        await this.rateLimiter.consume(key, 1);
        next();
      } catch (error) {
        if (error instanceof RateLimiterRes) {
          const retryAfter = Math.ceil(error.msBeforeNext / 1000);

          this.logger.warn('Rate limit exceeded', {
            clientIp,
            requestId: req.requestId,
            retryAfter,
          });

          res.status(429).json({
            jsonrpc: '2.0',
            error: {
              code: -32001,
              message: 'Rate limit exceeded',
              data: { retryAfter },
            },
            id: req.body?.id ?? null,
          });
        } else {
          this.logger.