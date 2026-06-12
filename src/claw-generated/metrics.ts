import { Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client';

const registry = new Registry();

// Block production metrics
export const blockProducedCounter = new Counter({
  name: 'claw_blocks_produced',
  help: 'Number of blocks produced',
  registers: [registry]
});

export const blockProductionLatencyGauge = new Gauge({
  name: 'claw_block_production_latency',
  help: 'Latency of block production in milliseconds',
  registers: [registry]
});

// Transaction metrics
export const transactionsReceivedCounter = new Counter({
  name: 'claw_transactions_received',
  help: 'Number of transactions received',
  registers: [registry]
});

export const transactionPoolSizeGauge = new Gauge({
  name: 'claw_transaction_pool_size',
  help: 'Number of transactions in the pool',
  registers: [registry]
});

// Peer metrics
export const peerCountGauge = new Gauge({
  name: 'claw_peer_count',
  help: 'Number of connected peers',
  registers: [registry]
});

// Other metrics
export const chainSyncStatusGauge = new Gauge({
  name: 'claw_chain_sync_status',
  help: 'Status of chain synchronization (0 = not synced, 1 = synced)',
  registers: [registry]
});

export const gasUsedCounter = new Counter({
  name: 'claw_gas_used',
  help: 'Total gas used',
  registers: [registry]
});

export const validatorPerformanceGauge = new Gauge({
  name: 'claw_validator_performance',
  help: 'Performance score of the validator',
  registers: [registry]
});

// Start collecting default metrics
collectDefaultMetrics({ register: registry });

export const getMetricsEndpoint = () => {
  return registry.metrics();
};