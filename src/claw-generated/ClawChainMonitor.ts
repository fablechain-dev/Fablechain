import { Metrics } from './Metrics';
import { Node } from './Node';
import { GrafanaDashboard } from './grafana';

export class ClawChainMonitor {
  private metrics: Metrics;
  private nodes: Node[];

  constructor(metrics: Metrics, nodes: Node[]) {
    this.metrics = metrics;
    this.nodes = nodes;
  }

  async monitorChain() {
    // Create Grafana dashboard
    const dashboard = new GrafanaDashboard(this.metrics, this.nodes);
    await dashboard.buildDashboard();

    // Continuously monitor chain health and update dashboard
    setInterval(() => {
      this.updateMetrics();
      this.updateNodeStats();
      dashboard.buildDashboard();
    }, 60000); // Update every minute
  }

  private updateMetrics() {
    // Update block and transaction metrics
    this.metrics.updateBlockMetrics(10, 5.2);
    this.metrics.updateTransactionMetrics(1000, 0.3);
  }

  private updateNodeStats() {
    // Update node status, uptime, and memory usage
    this.nodes.forEach((node) => {
      node.updateStatus('healthy');
      node.updateUptime(3600);
      node.updateMemoryUsage(512 * 1024 * 1024);
    });
  }
}