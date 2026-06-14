```typescript
import { Logger } from 'winston';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export interface PeerInfo {
  peerId: string;
  connected: boolean;
  latency: number;
  version: string;
}

export interface ConsensusSyncStatus {
  isSynced: boolean;
  currentHeight: number;
  targetHeight: number;
  syncPercentage: number;
  lastBlockTime: number;
}

export interface MempoolStatus {
  pendingTransactions: number;
  totalSize: number;
  maxSize: number;
  utilizationPercentage: number;
}

export interface DiskStatus {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  utilizationPercentage: number;
  healthy: boolean;
}

export interface HealthStatus {
  timestamp: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  consensus: ConsensusSyncStatus;
  peers: PeerInfo[];
  mempool: MempoolStatus;
  disk: DiskStatus;
  uptime: number;
  version: string;
}

export class HealthCheck {
  private logger: Logger;
  private startTime: number;
  private maxDiskUtilization: number = 0.9;
  private minPeers: number = 3;
  private maxMempoolSize: number = 500000000;
  private syncThreshold: number = 2;

  constructor(logger: Logger) {
    this.logger = logger;
    this.startTime = Date.now();
  }

  async check(): Promise<HealthStatus> {
    try {
      const [consensusStatus, peerStatus, mempoolStatus, diskStatus] = await Promise.all([
        this.checkConsensusSync(),
        this.checkPeerConnectivity(),
        this.checkMempool(),
        this.checkDiskSpace(),
      ]);

      const healthStatus: HealthStatus = {
        timestamp: Date.now(),
        status: this.determineOverallStatus(consensusStatus, peerStatus, mempoolStatus, diskStatus),
        consensus: consensusStatus,
        peers: peerStatus,
        mempool: mempoolStatus,
        disk: diskStatus,
        uptime: Date.now() - this.startTime,
        version: this.getVersion(),
      };

      this.logger.info('Health check completed', { status: healthStatus.status });
      return healthStatus;
    } catch (error) {
      this.logger.error('Health check failed', { error });
      throw error;
    }
  }

  private async checkConsensusSync(): Promise<ConsensusSyncStatus> {
    try {
      const currentHeight = await this.getCurrentBlockHeight();
      const targetHeight = await this.getTargetBlockHeight();
      const lastBlockTime = await this.getLastBlockTime();

      const syncPercentage = targetHeight > 0
        ? Math.min((currentHeight / targetHeight) * 100, 100)
        : 100;

      const isSynced = Math.abs(targetHeight - currentHeight) <= this.syncThreshold;

      return {
        isSynced,
        currentHeight,
        targetHeight,
        syncPercentage,
        lastBlockTime,
      };
    } catch (error) {
      this.logger.error('Failed to check consensus sync', { error });
      return {
        isSynced: false,
        currentHeight: 0,
        targetHeight: 0,
        syncPercentage: 0,
        lastBlockTime: 0,
      };
    }
  }

  private async checkPeerConnectivity(): Promise<PeerInfo[]> {
    try {
      const peers: PeerInfo[] = [];
      const peerList = await this.getPeerList();

      for (const peer of peerList) {
        try {
          const latency = await this.measurePeerLatency(peer.peerId);
          peers.push({
            peerId: peer.peerId,
            connected: latency < 5000,
            latency,
            version: peer.version || 'unknown',
          });
        } catch (error) {
          this.logger.warn('Failed to check peer', { peerId: peer.peerId, error });
          peers.push({
            peerId: peer.peerId,
            connected: false,
            latency: -1,
            version: peer.version || 'unknown',
          });
        }
      }

      return peers;
    } catch (error) {
      this.logger.error('Failed to check peer connectivity', { error });
      return [];
    }
  }

  private async checkMempool(): Promise<MempoolStatus> {
    try {
      const pendingTransactions = await this.getPendingTransactionCount();
      const totalSize = await this.getMempoolSize();
      const utilizationPercentage = (totalSize / this.maxMempoolSize) * 100;

      return {
        pendingTransactions,
        totalSize,
        maxSize: this.maxMempoolSize,
        utilizationPercentage,
      };
    } catch (error) {
      this.logger.error('Failed to check mempool', { error });
      return {
        pendingTransactions: 0,
        totalSize: 0,
        maxSize: this.maxMempoolSize,
        utilizationPercentage: 0,
      };
    }
  }

  private async checkDiskSpace(): Promise<DiskStatus> {
    try {
      const stats = await this.getDiskStats();
      const utilizationPercentage = (stats.usedSpace / stats.totalSpace) * 100;
      const healthy = utilizationPercentage < (this.maxDiskUtilization * 100);

      return {
        totalSpace: stats.totalSpace,
        usedSpace: stats.usedSpace,
        availableSpace: stats.availableSpace,
        utilizationPercentage,
        healthy,
      };
    } catch (error) {
      this.logger.error('Failed to check disk space', { error });
      return {
        totalSpace: 0,
        usedSpace: 0,
        availableSpace: 0,
        utilizationPercentage: 0,
        healthy: false,
      };
    }
  }

  private determineOverallStatus(
    consensus: ConsensusSyncStatus,
    peers: PeerInfo[],
    mempool: MempoolStatus,
    disk: DiskStatus,
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const connectedPeers = peers.filter((p) => p.connected).length;
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    if (!consensus.isSynced) {
      warnings.push('Node not in sync with network');
    }

    if (connectedPeers < this.minPeers) {
      criticalIssues.push(`Insufficient peer connections: ${connectedPeers}/${this.minPeers}`);
    }

    if (mempool.utilizationPercentage > 90) {
      warnings.push('Mempool nearly full');
    }

    if (!disk.healthy) {
      criticalIssues.push(`Disk space critical: ${disk.utilizationPercentage.toFixed(2)}%`);
    }

    if (criticalIssues.length > 0) {
      this.logger.warn('Critical health issues detected', { issues: criticalIssues });
      return 'unhealthy';
    }

    if (warnings.length > 0) {
      this.logger.warn('Health warnings detected', { warnings });
      return 'degraded';
    }

    return 'healthy';
  }

  private async getCurrentBlockHeight(): Promise<number> {
    return 100;
  }

  private async getTargetBlockHeight(): Promise<number> {
    return 101;
  }

  private async getLastBlockTime(): Promise<number> {
    return Date.now() - 12000;
  }

  private async getPeerList(): Promise<Array<{ peerId: string; version?: string }