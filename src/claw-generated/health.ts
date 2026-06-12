import { Request, Response } from 'express';
import { ClawChain } from '../chain/ClawChain';

export async function healthHandler(req: Request, res: Response) {
  // Check chain health
  const chainHealth = ClawChain.isHealthy();

  res.status(chainHealth ? 200 : 503).json({
    status: chainHealth ? 'healthy' : 'unhealthy',
    message: chainHealth ? 'ClawChain is healthy' : 'ClawChain is unhealthy'
  });
}

export async function readyHandler(req: Request, res: Response) {
  // Check if the node is ready to accept requests
  const isReady = ClawChain.isReady();

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    message: isReady ? 'ClawChain is ready' : 'ClawChain is not ready'
  });
}