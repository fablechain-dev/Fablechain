```typescript
import * as prometheus from 'prom-client';
import { EventEmitter } from 'events';

export interface MetricsConfig {
  namespace: string;
  subsystem: string;
  defaultBuckets?: number[];
  enableDefaultMetrics?: boolean;
}

export interface BlockchainMetrics {
  blockHeight: prometheus.Gauge;
  peerCount: prometheus.Gauge;
  mempoolSize: prometheus.Gauge;
  consensusRoundDuration: prometheus.Histogram;
  blockProcessingTime: prometheus.Histogram;
  transactionCount: prometheus.Counter;
  failedBlocks: prometheus.Counter;
  networkLatency: prometheus.Histogram;
  validatorSetSize: prometheus.Gauge;
  lastBlockTimestamp: prometheus.Gauge;
}

export class Metrics extends EventEmitter {
  private metrics: BlockchainMetrics;
  private config: MetricsConfig;
  private updateInterval: NodeJS.Timer | null = null;

  constructor(config: MetricsConfig) {
    super();
    this.config = {
      namespace: config.namespace || 'fablechain',
      subsystem: config.subsystem || 'blockchain',
      defaultBuckets: config.defaultBuckets || [0.1, 0.5, 1, 2, 5, 10],
      enableDefaultMetrics: config.enableDefaultMetrics !== false,
    };

    if (this.config.enableDefaultMetrics) {
      prometheus.collectDefaultMetrics();
    }

    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): BlockchainMetrics {
    const prefix = `${this.config.namespace}_${this.config.subsystem}`;

    return {
      blockHeight: new prometheus.Gauge({
        name: `${prefix}_block_height`,
        help: 'Current block height of the blockchain',
        labelNames: ['network'],
      }),

      peerCount: new prometheus.Gauge({
        name: `${prefix}_peer_count`,
        help: 'Number of connected peers in the network',
        labelNames: ['peer_type'],
      }),

      mempoolSize: new prometheus.Gauge({
        name: `${prefix}_mempool_size`,
        help: 'Number of transactions in the mempool',
        labelNames: ['priority'],
      }),

      consensusRoundDuration: new prometheus.Histogram({
        name: `${prefix}_consensus_round_duration_seconds`,
        help: 'Duration of consensus rounds in seconds',
        buckets: this.config.defaultBuckets,
        labelNames: ['round_type', 'status'],
      }),

      blockProcessingTime: new prometheus.Histogram({
        name: `${prefix}_block_processing_time_seconds`,
        help: 'Time taken to process and validate blocks',
        buckets: this.config.defaultBuckets,
        labelNames: ['block_source'],
      }),

      transactionCount: new prometheus.Counter({
        name: `${prefix}_transactions_total`,
        help: 'Total number of transactions processed',
        labelNames: ['tx_type', 'status'],
      }),

      failedBlocks: new prometheus.Counter({
        name: `${prefix}_failed_blocks_total`,
        help: 'Total number of failed block validations',
        labelNames: ['failure_reason'],
      }),

      networkLatency: new prometheus.Histogram({
        name: `${prefix}_network_latency_seconds`,
        help: 'Network latency measurements between nodes',
        buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2],
        labelNames: ['peer_id', 'direction'],
      }),

      validatorSetSize: new prometheus.Gauge({
        name: `${prefix}_validator_set_size`,
        help: 'Number of active validators in the current set',
        labelNames: ['network'],
      }),

      lastBlockTimestamp: new prometheus.Gauge({
        name: `${prefix}_last_block_timestamp`,
        help: 'Unix timestamp of the last block',
        labelNames: ['network'],
      }),
    };
  }

  public updateBlockHeight(height: number, network: string = 'mainnet'): void {
    this.metrics.blockHeight.set({ network }, height);
    this.emit('blockHeight', { height, network, timestamp: Date.now() });
  }

  public updatePeerCount(count: number, peerType: string = 'full'): void {
    this.metrics.peerCount.set({ peer_type: peerType }, count);
    this.emit('peerCount', { count, peerType, timestamp: Date.now() });
  }

  public updateMempoolSize(size: number, priority: string = 'standard'): void {
    this.metrics.mempoolSize.set({ priority }, size);
    this.emit('mempoolSize', { size, priority, timestamp: Date.now() });
  }

  public recordConsensusRoundDuration(
    durationSeconds: number,
    roundType: string = 'bft',
    status: string = 'success'
  ): void {
    this.metrics.consensusRoundDuration.observe(
      { round_type: roundType, status },
      durationSeconds
    );
    this.emit('consensusRound', {
      duration: durationSeconds,
      roundType,
      status,
      timestamp: Date.now(),
    });
  }

  public recordBlockProcessingTime(
    durationSeconds: number,
    blockSource: string = 'network'
  ): void {
    this.metrics.blockProcessingTime.observe(
      { block_source: blockSource },
      durationSeconds
    );
  }

  public recordTransaction(txType: string, status: string = 'success'): void {
    this.metrics.transactionCount.inc({ tx_type: txType, status });
  }

  public recordFailedBlock(reason: string): void {
    this.metrics.failedBlocks.inc({ failure_reason: reason });
    this.emit('failedBlock', { reason, timestamp: Date.now() });
  }

  public recordNetworkLatency(
    latencySeconds: number,
    peerId: string,
    direction: string = 'inbound'
  ): void {
    this.metrics.networkLatency.observe(
      { peer_id: peerId, direction },
      latencySeconds
    );
  }

  public updateValidatorSetSize(size: number, network: string = 'mainnet'): void {
    this.metrics.validatorSetSize.set({ network }, size);
  }

  public updateLastBlockTimestamp(timestamp: number, network: string = 'mainnet'): void {
    this.metrics.lastBlockTimestamp.set({ network }, timestamp / 1000);
  }

  public getMetrics(): BlockchainMetrics {
    return this.metrics;
  }

  public async getPrometheusMetrics(): Promise<string> {
    return prometheus.register.metrics();
  }

  public resetAllMetrics(): void {
    prometheus.register.resetMetrics();
    this.metrics = this.initializeMetrics();
    this.emit('metricsReset', { timestamp: Date.now() });
  }

  public startPeriodicUpdates(intervalMs: number = 5000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.emit('periodicUpdate', { timestamp: Date.now() });
    }, intervalMs);
  }

  public stopPeriodicUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public getMetricValue(metricName: keyof BlockchainMetrics): number | undefined {
    const metric = this.metrics[metricName];
    if (!metric) {
      return undefined;
    }

    const value = (metric as any).get?.();
    return value?.values?.[0]?.value ?? value;
  }

  public exportMetricsAsJson(): Record<string, unknown> {
    return {
      blockHeight: this.