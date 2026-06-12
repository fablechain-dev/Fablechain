import { Request, Response } from 'express';
import { OpenChain } from '../chain/OpenChain';

export async function healthHandler(req: Request, res: Response) {
  // Check chain health
  const chainHealth = OpenChain.isHealthy();

  res.status(chainHealth ? 200 : 503).json({
    status: chainHealth ? 'healthy' : 'unhealthy',
    message: chainHealth ? 'OpenChain is healthy' : 'OpenChain is unhealthy'
  });
}

export async function readyHandler(req: Request, res: Response) {
  // Check if the node is ready to accept requests
  const isReady = OpenChain.isReady();

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not ready',
    message: isReady ? 'OpenChain is ready' : 'OpenChain is not ready'
  });
}