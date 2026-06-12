import express, { Express, Request, Response } from 'express';
import { healthCheck, readyCheck } from './health';

const app: Express = express();

app.get('/health', healthCheck);
app.get('/ready', readyCheck);

app.listen(3000, () => {
  console.log('API server started on port 3000');
});