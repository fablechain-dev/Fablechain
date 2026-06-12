/**
 * x402 Server (Seller Side) — Express Middleware
 * Protects premium network endpoints with Solana USDC micropayments.
 *
 * Uses @x402/express middleware with @x402/svm for Solana Devnet settlement.
 * Each premium endpoint routes payments to the relevant agent's wallet.
 */

import { Request, Response, NextFunction } from 'express';
import { X402_CONFIG, PREMIUM_ENDPOINTS } from './types';
import { getOrCreateWallet, logPayment } from './wallets';

// Use require() for x402 packages due to moduleResolution: "node" not supporting subpath exports
const { paymentMiddleware } = require('@x402/express') as {
  paymentMiddleware: (
    server: any,
    routes: Record<string, { description?: string; resource?: any }>
  ) => (req: Request, res: Response, next: NextFunction) => void;
  x402ResourceServer: any;
};

const { HTTPFacilitatorClient, x402ResourceServer: X402ResourceServer } = require('@x402/express') as {
  HTTPFacilitatorClient: new (config?: { url?: string }) => any;
  x402ResourceServer: new (facilitator: any) => any;
};

// We need the core server for resource server creation
const coreServer = require('@x402/core/dist/cjs/server/index.js') as {
  HTTPFacilitatorClient: new (config?: { url?: string }) => any;
  x402ResourceServer: new (facilitator: any) => any;
};

const svmServer = require('@x402/svm/dist/cjs/exact/server/index.js') as {
  registerExactSvmScheme: (server: any) => void;
  ExactSvmScheme: any;
};

let resourceServer: any = null;
let isInitialized = false;

/**
 * Initialize the x402 resource server with Solana Devnet facilitator
 */
export function initX402Server(): boolean {
  if (!X402_CONFIG.enabled) {
    console.log('[x402] Server disabled via X402_ENABLED=false');
    return false;
  }

  try {
    const facilitator = new coreServer.HTTPFacilitatorClient({
      url: X402_CONFIG.facilitatorUrl,
    });

    resourceServer = new coreServer.x402ResourceServer(facilitator);
    svmServer.registerExactSvmScheme(resourceServer);

    isInitialized = true;
    console.log(`[x402] Server initialized — facilitator: ${X402_CONFIG.facilitatorUrl}`);
    console.log(`[x402] Network: ${X402_CONFIG.network}`);
    return true;
  } catch (e) {
    console.error('[x402] Failed to initialize server:', e);
    return false;
  }
}

/**
 * Build the route configuration for x402 premium endpoints.
 * Each endpoint's payTo is the receiving agent's Solana address.
 *
 * @param defaultAgentId - The default agent whose wallet receives payments
 */
export function buildRouteConfig(defaultAgentId: string = 'claw-main'): Record<string, any> {
  const defaultWallet = getOrCreateWallet(defaultAgentId);
  const routes: Record<string, any> = {};

  for (const endpoint of PREMIUM_ENDPOINTS) {
    const routeKey = `${endpoint.method} ${endpoint.path}`;
    const receiverAgentId = endpoint.receiverAgentId || defaultAgentId;
    const receiverWallet = getOrCreateWallet(receiverAgentId);

    routes[routeKey] = {
      description: endpoint.description,
      resource: {
        scheme: X402_CONFIG.scheme,
        network: X402_CONFIG.network,
        payTo: receiverWallet.publicKey,
        price: endpoint.price,
      },
    };
  }

  return routes;
}

/**
 * Create Express middleware that gates premium endpoints with x402 payments.
 * Non-premium routes pass through untouched.
 */
export function createX402Middleware(defaultAgentId: string = 'claw-main'): (req: Request, res: Response, next: NextFunction) => void {
  if (!isInitialized || !resourceServer) {
    // If x402 is not initialized, return a middleware that responds with 503 for premium routes
    return (req: Request, res: Response, next: NextFunction) => {
      const isPremium = PREMIUM_ENDPOINTS.some(
        ep => req.method === ep.method && req.path.startsWith('/premium/')
      );
      if (isPremium) {
        return res.status(503).json({
          error: 'x402 payment system not initialized',
          x402Enabled: false,
        });
      }
      next();
    };
  }

  const routes = buildRouteConfig(defaultAgentId);

  try {
    return paymentMiddleware(resourceServer, routes);
  } catch (e) {
    console.error('[x402] Failed to create middleware:', e);
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
}

/**
 * Manual x402 402 response for custom per-agent pricing.
 * Use this when the payTo address varies per request (e.g., agent-specific insights).
 */
export function send402Response(
  res: Response,
  agentId: string,
  price: string,
  description: string
): void {
  const wallet = getOrCreateWallet(agentId);

  const paymentRequired = {
    x402Version: 2,
    accepts: [
      {
        scheme: X402_CONFIG.scheme,
        network: X402_CONFIG.network,
        payTo: wallet.publicKey,
        price,
      },
    ],
    description,
  };

  res.status(402)
    .set('X-Payment-Required', Buffer.from(JSON.stringify(paymentRequired)).toString('base64'))
    .json({
      error: 'Payment Required',
      x402: paymentRequired,
    });
}

export function isX402Initialized(): boolean {
  return isInitialized;
}

export function getResourceServer(): any {
  return resourceServer;
}
