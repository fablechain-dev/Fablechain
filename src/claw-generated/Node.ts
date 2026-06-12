export class Node {
  status: string = 'healthy';
  uptimeSeconds: number = 0;
  memoryUsageBytes: number = 0;

  updateStatus(status: string) {
    this.status = status;
  }

  updateUptime(uptime: number) {
    this.uptimeSeconds = uptime;
  }

  updateMemoryUsage(usage: number) {
    this.memoryUsageBytes = usage;
  }
}