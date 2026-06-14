```typescript
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { Logger } from 'winston';
import crypto from 'crypto';

interface RpcRequest {
  jsonrpc: string;
  method: string;
  params?: unknown[];
  id: string | number | null;
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

interface MiddlewareConfig {
  allowedMethods: Set<string>;
  rateLimitPoints: number;
  rateLimitDurationSeconds: number;
  logger: Logger;
  blockDurationSeconds: number;
  enableRequestLogging: boolean;
  enableResponseLogging: boolean;
}

interface RequestMetadata {
  startTime: number;
  requestId: string;
  clientIp: string;
  method?: string;
  params?: unknown[];
}

const DEFAULT_CONFIG: Partial<MiddlewareConfig> = {
  rateLimitPoints: 100,
  rateLimitDurationSeconds: 60,
  blockDurationSeconds: 900,
  enableRequestLogging: true,
  enableResponseLogging: true,
};

export class RpcMiddleware {
  private rateLimiter: RateLimiterMemory;
  private config: MiddlewareConfig;
  private requestMetadataMap: WeakMap<Request, RequestMetadata>;

  constructor(config: Partial<MiddlewareConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    } as MiddlewareConfig;

    this.rateLimiter = new RateLimiterMemory({
      points: this.config.rateLimitPoints,
      duration: this.config.rateLimitDurationSeconds,
      blockDurationMs: this.config.blockDurationSeconds * 1000,
    });

    this.requestMetadataMap = new WeakMap();
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
  }

  private generateRequestId(): string {
    return crypto.randomUUID();
  }

  private async checkRateLimit(ip: string): Promise<RateLimiterRes> {
    try {
      return await this.rateLimiter.consume(ip, 1);
    } catch (rejRes) {
      if (rejRes instanceof RateLimiterRes) {
        throw new Error(
          `Rate limit exceeded. Retry after ${Math.ceil(rejRes.msBeforeNext / 1000)} seconds`,
        );
      }
      throw rejRes;
    }
  }

  private logRequest(metadata: RequestMetadata): void {
    if (!this.config.enableRequestLogging) return;

    this.config.logger.debug('RPC Request received', {
      requestId: metadata.requestId,
      clientIp: metadata.clientIp,
      method: metadata.method,
      timestamp: new Date(metadata.startTime).toISOString(),
    });
  }

  private logResponse(
    metadata: RequestMetadata,
    response: RpcResponse,
    statusCode: number,
  ): void {
    if (!this.config.enableResponseLogging) return;

    const duration = Date.now() - metadata.startTime;
    const isError = !!response.error;

    this.config.logger.debug('RPC Response sent', {
      requestId: metadata.requestId,
      clientIp: metadata.clientIp,
      method: metadata.method,
      statusCode,
      duration: `${duration}ms`,
      hasError: isError,
      errorCode: response.error?.code,
      timestamp: new Date().toISOString(),
    });
  }

  rateLimitMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const clientIp = this.getClientIp(req);
    const requestId = this.generateRequestId();

    const metadata: RequestMetadata = {
      startTime: Date.now(),
      requestId,
      clientIp,
    };

    this.requestMetadataMap.set(req, metadata);

    try {
      await this.checkRateLimit(clientIp);
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.config.logger.warn('Rate limit violation', {
        clientIp,
        requestId,
        error: errorMessage,
      });

      const response: RpcResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Server error',
          data: 'Rate limit exceeded',
        },
        id: null,
      };

      res.status(429).json(response);
    }
  };

  methodAllowlistMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const metadata = this.requestMetadataMap.get(req);
    const rpcRequest: RpcRequest = req.body as RpcRequest;

    if (!rpcRequest || !rpcRequest.method) {
      const response: RpcResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error',
        },
        id: null,
      };

      res.status(400).json(response);
      return;
    }

    const method = rpcRequest.method;

    if (metadata) {
      metadata.method = method;
      metadata.params = rpcRequest.params;
    }

    if (!this.config.allowedMethods.has(method)) {
      this.config.logger.warn('Method not allowed', {
        requestId: metadata?.requestId,
        clientIp: metadata?.clientIp,
        method,
      });

      const response: RpcResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: 'Method not found',
        },
        id: rpcRequest.id,
      };

      res.status(400).json(response);
      return;
    }

    next();
  };

  requestLoggingMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const metadata = this.requestMetadataMap.get(req);

    if (metadata) {
      this.logRequest(metadata);
    }

    const originalJson = res.json.bind(res);

    res.json = function (body: RpcResponse): Response {
      const metadata = this.req
        ? this.req instanceof Request
          ? new WeakMap().get(this.req)
          : undefined
        : undefined;

      if (metadata) {
        this.logResponse(metadata, body, this.statusCode);
      }

      return originalJson(body);
    };

    next();
  };

  errorHandlingMiddleware = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    this.config.logger.error('RPC middleware error', {
      error: err.message,
      stack: err.stack,
    });

    const response: RpcResponse = {
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
      },
      id: null,
    };

    res.status(500).json(response);
  };
}

export default RpcMiddleware;
```