import { Gauge, Counter, Histogram } from 'prom-client';

// Chain health metrics
export const blockHeight = new Gauge({
  name: 'chain_block_height',
  help: 'Current block height of the chain',
});

export const blockTime = new Histogram({
  name: 'chain_block_time',
  help: 'Block time distribution',
  buckets: [1, 2, 3, 4, 5, 10, 20, 30],
});

export const txThroughput = new Counter({
  name: 'chain_tx_throughput',
  help: 'Transactions processed per second',
});

// Node performance metrics
export const cpuUsage = new Gauge({
  name: 'node_cpu_usage',
  help: 'CPU utilization of the node',
});

export const memoryUsage = new Gauge({
  name: 'node_memory_usage',
  help: 'Memory usage of the node',
});

export const diskUsage = new Gauge({
  name: 'node_disk_usage',
  help: 'Disk utilization of the node',
});

export const networkUsage = new Gauge({
  name: 'node_network_usage',
  help: 'Network bandwidth usage of the node',
});

// Contract execution metrics
export const contractDeployments = new Counter({
  name: 'contract_deployments',
  help: 'Number of contract deployments',
});

export const contractExecutionDuration = new Histogram({
  name: 'contract_execution_duration',
  help: 'Contract execution duration',
  buckets: [0.1, 0.5, 1, 2.5, 5, 10],
});

export const contractCallFailures = new Counter({
  name: 'contract_call_failures',
  help: 'Number of failed contract calls',
});