```typescript
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';

export interface PeerMetrics {
  peerId: string;
  responseTimes: number[];
  blockReputations: Map<string, number>;
  attestationSpeed: number[];
  lastSeen: number;
  totalRequests: number;
  failedRequests: number;
  penaltyScore: number;
  isBanned: boolean;
  banReason?: string;
  banUntil?: number;
}

export interface ScoringConfig {
  maxResponseTimeMs: number;
  minResponseTimeMs: number;
  responseTimeWindow: number;
  attestationRewardThresholdMs: number;
  badBlockPenalty: number;
  fastAttestationReward: number;
  failureThreshold: number;
  banThreshold: number;
  banDurationMs: number;
  metricsDecayRate: number;
  maxMetricsWindow: number;
}

export interface PeerScore {
  peerId: string;
  score: number;
  latency: number;
  reliability: number;
  isBanned: boolean;
  blockReputation: number;
}

const DEFAULT_CONFIG: ScoringConfig = {
  maxResponseTimeMs: 5000,
  minResponseTimeMs: 10,
  responseTimeWindow: 100,
  attestationRewardThresholdMs: 500,
  badBlockPenalty: 50,
  fastAttestationReward: 10,
  failureThreshold: 0.3,
  banThreshold: 200,
  banDurationMs: 86400000,
  metricsDecayRate: 0.95,
  maxMetricsWindow: 1000,
};

export class PeerScoring extends EventEmitter {
  private peers: Map<string, PeerMetrics>;
  private banList: Set<string>;
  private config: ScoringConfig;
  private logger: Logger;
  private decayInterval: NodeJS.Timeout | null;

  constructor(config: Partial<ScoringConfig> = {}, logger?: Logger) {
    super();
    this.peers = new Map();
    this.banList = new Set();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = logger || new Logger('PeerScoring');
    this.decayInterval = null;
    this.startMetricsDecay();
  }

  recordResponseTime(peerId: string, latencyMs: number): void {
    const metrics = this.getOrCreateMetrics(peerId);

    if (latencyMs > this.config.maxResponseTimeMs) {
      metrics.penaltyScore += 5;
      this.logger.warn(`Peer ${peerId} exceeded max response time: ${latencyMs}ms`);
    }

    if (latencyMs < this.config.minResponseTimeMs) {
      this.logger.warn(`Peer ${peerId} reported suspiciously fast response: ${latencyMs}ms`);
      metrics.penaltyScore += 2;
    }

    metrics.responseTimes.push(latencyMs);
    if (metrics.responseTimes.length > this.config.responseTimeWindow) {
      metrics.responseTimes.shift();
    }

    metrics.lastSeen = Date.now();
    metrics.totalRequests++;

    this.checkBanStatus(peerId);
  }

  recordFailedRequest(peerId: string): void {
    const metrics = this.getOrCreateMetrics(peerId);
    metrics.failedRequests++;
    metrics.penaltyScore += 3;

    const failureRate = metrics.failedRequests / metrics.totalRequests;
    if (failureRate > this.config.failureThreshold) {
      metrics.penaltyScore += 10;
      this.logger.warn(`Peer ${peerId} failure rate critical: ${failureRate.toFixed(2)}`);
    }

    this.checkBanStatus(peerId);
  }

  recordBadBlock(peerId: string, blockHash: string, severity: number = 1): void {
    const metrics = this.getOrCreateMetrics(peerId);

    const currentReputation = metrics.blockReputations.get(blockHash) || 0;
    metrics.blockReputations.set(blockHash, currentReputation - this.config.badBlockPenalty * severity);

    metrics.penaltyScore += this.config.badBlockPenalty * severity;

    this.logger.error(`Peer ${peerId} propagated bad block ${blockHash.slice(0, 8)}... (severity: ${severity})`);
    this.emit('badBlockDetected', { peerId, blockHash, severity });

    this.checkBanStatus(peerId);
  }

  recordFastAttestation(peerId: string, attestationHash: string, timeMs: number): void {
    if (timeMs > this.config.attestationRewardThresholdMs) {
      return;
    }

    const metrics = this.getOrCreateMetrics(peerId);
    metrics.attestationSpeed.push(timeMs);

    if (metrics.attestationSpeed.length > this.config.maxMetricsWindow) {
      metrics.attestationSpeed.shift();
    }

    metrics.penaltyScore = Math.max(0, metrics.penaltyScore - this.config.fastAttestationReward);
    metrics.lastSeen = Date.now();

    this.logger.debug(`Peer ${peerId} fast attestation: ${timeMs}ms for ${attestationHash.slice(0, 8)}...`);
  }

  banPeer(peerId: string, reason: string, durationMs: number = this.config.banDurationMs): void {
    const metrics = this.getOrCreateMetrics(peerId);
    metrics.isBanned = true;
    metrics.banReason = reason;
    metrics.banUntil = Date.now() + durationMs;

    this.banList.add(peerId);

    this.logger.warn(`Peer ${peerId} banned: ${reason} (until ${new Date(metrics.banUntil).toISOString()})`);
    this.emit('peerBanned', { peerId, reason, until: metrics.banUntil });
  }

  unbanPeer(peerId: string): void {
    const metrics = this.peers.get(peerId);
    if (!metrics) {
      return;
    }

    metrics.isBanned = false;
    metrics.banReason = undefined;
    metrics.banUntil = undefined;
    this.banList.delete(peerId);

    this.logger.info(`Peer ${peerId} unbanned`);
    this.emit('peerUnbanned', { peerId });
  }

  isBanned(peerId: string): boolean {
    const metrics = this.peers.get(peerId);
    if (!metrics) {
      return false;
    }

    if (!metrics.isBanned) {
      return false;
    }

    if (metrics.banUntil && Date.now() > metrics.banUntil) {
      this.unbanPeer(peerId);
      return false;
    }

    return true;
  }

  getScore(peerId: string): PeerScore {
    const metrics = this.peers.get(peerId);

    if (!metrics) {
      return {
        peerId,
        score: 100,
        latency: 0,
        reliability: 1,
        isBanned: false,
        blockReputation: 0,
      };
    }

    const avgLatency = this.calculateAverageLatency(metrics);
    const reliability = this.calculateReliability(metrics);
    const blockReputation = this.calculateBlockReputation(metrics);

    let baseScore = 100;
    baseScore -= metrics.penaltyScore;
    baseScore -= (avgLatency / this.config.maxResponseTimeMs) * 20;
    baseScore -= (1 - reliability) * 30;
    baseScore = Math.max(0, Math.min(100, baseScore));

    return {
      peerId,
      score: baseScore,
      latency: avgLatency,
      reliability,
      isBanned: metrics.isBanned