import { Router, Request, Response } from 'express';

const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK' });
});

healthRouter.get('/ready', (req: Request, res: Response) => {
  // Check if the node is fully synced and ready to process transactions
  const isReady = true; // Replace with actual readiness check
  res.status(isReady ? 200 : 503).json({ ready: isReady });
});

export default healthRouter;