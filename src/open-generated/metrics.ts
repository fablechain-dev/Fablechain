// src/open-generated/metrics.ts
import { Gauge, Counter, Histogram } from 'prom-client';

export const blockGauge = new Gauge({
  name: 'openchain_blocks',
  help: 'Number of blocks in the chain',
});

export const transactionCounter = new Counter({
  name: 'openchain_transactions',
  help: 'Total number of transactions processed',
});

export const blockTimeHistogram = new Histogram({
  name: 'openchain_block_time',
  help: 'Time taken to produce a block',
  buckets: [0.1, 0.5, 1, 5, 10, 30],
});