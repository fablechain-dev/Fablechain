import { Metrics } from './Metrics';
import { Node } from './Node';
import { GrafanaDashboard } from './grafana';

describe('GrafanaDashboard', () => {
  let metrics: Metrics;
  let nodes: Node[];

  beforeEach(() => {
    metrics = new Metrics();
    nodes = [
      new Node(),
      new Node(),
      new Node(),
    ];
  });

  it('should create a dashboard with all expected panels', async () => {
    const dashboard = new GrafanaDashboard(metrics, nodes);
    await dashboard.buildDashboard();

    expect(dashboard['blockPanel']).toBeDefined();
    expect(dashboard['transactionPanel']).toBeDefined();
    expect(dashboard['nodePanel']).toBeDefined();
    expect(dashboard['alertPanel']).toBeDefined();
  });

  it('should update block metrics in the dashboard', async () => {
    const dashboard = new GrafanaDashboard(metrics, nodes);
    await dashboard.buildDashboard();

    metrics.updateBlockMetrics(100, 6.2);
    await dashboard.buildDashboard();

    expect(dashboard['blockPanel'].targets[0].query).toContain('rate(blocks_produced_total[1m])');
    expect(dashboard['blockPanel'].targets[1].query).toContain('avg(block_time_seconds)');
  });

  it('should update transaction metrics in the dashboard', async () => {
    const dashboard = new GrafanaDashboard(metrics, nodes);
    await dashboard.buildDashboard();

    metrics.updateTransactionMetrics(10000, 0.2);
    await dashboard.buildDashboard();

    expect(dashboard['transactionPanel'].targets[0].query).toContain('rate(transactions_processed_total[1m])');
    expect(dashboard['transactionPanel'].targets[1].query).toContain('avg(transaction_time_seconds)');
  });

  it('should update node metrics in the dashboard', async () => {
    const dashboard = new GrafanaDashboard(metrics, nodes);
    await dashboard.buildDashboard();

    nodes[0].updateStatus('unhealthy');
    nodes[0].updateUptime(3600);
    nodes[0].updateMemoryUsage(512 * 1024 * 1024);
    await dashboard.buildDashboard();

    expect(dashboard['nodePanel'].targets[0].query).toContain('node_status');
    expect(dashboard['nodePanel'].targets[1].query).toContain('node_uptime_seconds');
    expect(dashboard['nodePanel'].targets[2].query).toContain('node_memory_usage_bytes');
  });
});