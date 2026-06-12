import { Counter, Gauge, collectDefaultMetrics, register } from 'prom-client';

// Initialize Prometheus metrics
collectDefaultMetrics();

// Blockchain metrics
export const blockProduced = new Counter({
  name: 'blockchain_blocks_produced',
  help: 'Total number of blocks produced',
});

export const transactionsProcessed = new Counter({
  name: 'blockchain_transactions_processed',
  help: 'Total number of transactions processed',
});

export const transactionPoolSize = new Gauge({
  name: 'blockchain_transaction_pool_size',
  help: 'Current size of the transaction pool',
});

export const blockProductionRate = new Gauge({
  name: 'blockchain_block_production_rate',
  help: 'Blocks produced per second',
});

export const peerConnections = new Gauge({
  name: 'blockchain_peer_connections',
  help: 'Number of active peer connections',
});

export const chainHeight = new Gauge({
  name: 'blockchain_height',
  help: 'Current blockchain height',
});

export const chainDifficulty = new Gauge({
  name: 'blockchain_difficulty',
  help: 'Current blockchain difficulty',
});

export const registerMetrics = () => {
  register.registerMetric(blockProduced);
  register.registerMetric(transactionsProcessed);
  register.registerMetric(transactionPoolSize);
  register.registerMetric(blockProductionRate);
  register.registerMetric(peerConnections);
  register.registerMetric(chainHeight);
  register.registerMetric(chainDifficulty);
};