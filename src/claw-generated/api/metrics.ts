import express from 'express';
import { getMetricsEndpoint } from '../metrics';

const router = express.Router();

router.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(getMetricsEndpoint());
});

export default router;