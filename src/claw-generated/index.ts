import express from 'express';
import apiRouter from './api';
import { getMetricsEndpoint } from './metrics';
import metricsRouter from './api/metrics';

const app = express();

app.use('/api', apiRouter);
app.use('/metrics', metricsRouter);

app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(3000, () => {
  console.log('ClawChain API server started on port 3000');
});