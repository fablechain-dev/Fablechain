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

export const stateUpdates = new Counter({
  name: 'blockchain_state_updates',
  help: 'Total number of state updates',
});

export const stateSnapshotSize = new Gauge({
  name: 'blockchain_state_snapshot_size',
  help: 'Size of the current state snapshot (bytes)',
});

export const contractDeployments = new Counter({
  name: 'blockchain_contract_deployments',
  help: 'Total number of contract deployments',
});

export const contractExecutions = new Counter({
  name: 'blockchain_contract_executions',
  help: 'Total number of contract executions',
});

export const rpcRequests = new Counter({
  name: 'blockchain_rpc_requests',
  help: 'Total number of RPC requests',
});

export const rpcErrors = new Counter({
  name: 'blockchain_rpc_errors',
  help: 'Total number of RPC errors',
});

export const validatorParticipation = new Gauge({
  name: 'blockchain_validator_participation',
  help: 'Percentage of active validators',
});

export const validatorRewards = new Gauge({
  name: 'blockchain_validator_rewards',
  help: 'Total validator rewards',
});

export const registerMetrics = () => {
  register.registerMetric(blockProduced);
  register.registerMetric(transactionsProcessed);
  register.registerMetric(transactionPoolSize);
  register.registerMetric(blockProductionRate);
  register.registerMetric(peerConnections);
  register.registerMetric(chainHeight);
  register.registerMetric(chainDifficulty);
  register.registerMetric(stateUpdates);
  register.registerMetric(stateSnapshotSize);
  register.registerMetric(contractDeployments);
  register.registerMetric(contractExecutions);
  register.registerMetric(rpcRequests);
  register.registerMetric(rpcErrors);
  register.registerMetric(validatorParticipation);
  register.registerMetric(validatorRewards);
};