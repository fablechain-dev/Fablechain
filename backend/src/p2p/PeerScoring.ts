```typescript
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface PeerMetrics {
  peerId: string;
  responseLatencyMs: number[];
  successfulResponses: number;
  failedResponses: number;
  badBlocksDetected: number;
  fastAttestations: number;
  lastSeen: number;
  score: number;
  isBanned: boolean;
  banReason?: string;
  bannedUntil?: number;
}

interface ScoringConfig {
  maxLatencyMs: number;
  minScoreThreshold: number;
  banThreshold: number;
  latencyWindowSize: number;
  decayRate: number;
  badBlockPenalty: number;
  fastAttestationReward: number;
  tempBanDurationMs: number;
  permanentBanThreshold: number;
}

interface BanListEntry {
  peerId: string;
  reason: string;
  timestamp: number;
  permanent: boolean;
  expiresAt?: number;
}

const DEFAULT_CONFIG: ScoringConfig = {
  maxLatencyMs: 5000,
  minScoreThreshold: -100,
  banThreshold: -500,
  latencyWindowSize: 100,
  decayRate: 0.95,
  badBlockPenalty: -50,
  fastAttestationReward: 10,
  tempBanDurationMs: 3600000,
  permanentBanThreshold: 5,
};

export class PeerScoring extends EventEmitter {
  private peers: Map<string, PeerMetrics> = new Map();
  private banList: Map<string, BanListEntry> = new Map();
  private config: ScoringConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private scoreDecayInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<ScoringConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startBackgroundTasks();
  }

  private startBackgroundTasks(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredBans();
      this.pruneOldMetrics();
    }, 60000);

    this.scoreDecayInterval = setInterval(() => {
      this.applyScoreDecay();
    }, 5000);
  }

  private initializePeer(peerId: string): PeerMetrics {
    if (!this.peers.has(peerId)) {
      this.peers.set(peerId, {
        peerId,
        responseLatencyMs: [],
        successfulResponses: 0,
        failedResponses: 0,
        badBlocksDetected: 0,
        fastAttestations: 0,
        lastSeen: Date.now(),
        score: 0,
        isBanned: false,
      });
    }
    return this.peers.get(peerId)!;
  }

  recordResponseLatency(peerId: string, latencyMs: number): void {
    const peer = this.initializePeer(peerId);
    peer.lastSeen = Date.now();

    if (latencyMs > this.config.maxLatencyMs) {
      peer.failedResponses++;
      peer.score -= 5;
      this.emit('latency:slow', { peerId, latencyMs });
      return;
    }

    peer.responseLatencyMs.push(latencyMs);
    if (peer.responseLatencyMs.length > this.config.latencyWindowSize) {
      peer.responseLatencyMs.shift();
    }

    peer.successfulResponses++;
    const reward = Math.max(0, 10 - Math.floor(latencyMs / 500));
    peer.score += reward;

    this.checkAndUpdateScore(peerId);
  }

  recordBadBlock(peerId: string, blockHash: string): void {
    if (this.isBanned(peerId)) {
      return;
    }

    const peer = this.initializePeer(peerId);
    peer.badBlocksDetected++;
    peer.score += this.config.badBlockPenalty;

    this.emit('block:bad', { peerId, blockHash, score: peer.score });

    if (peer.badBlocksDetected >= 3) {
      this.banPeer(peerId, `Too many bad blocks: ${peer.badBlocksDetected}`, false);
    }

    this.checkAndUpdateScore(peerId);
  }

  recordFastAttestation(peerId: string): void {
    if (this.isBanned(peerId)) {
      return;
    }

    const peer = this.initializePeer(peerId);
    peer.fastAttestations++;
    peer.score += this.config.fastAttestationReward;

    this.emit('attestation:fast', { peerId, score: peer.score });
    this.checkAndUpdateScore(peerId);
  }

  recordFailedResponse(peerId: string, reason: string): void {
    const peer = this.initializePeer(peerId);
    peer.failedResponses++;
    peer.score -= 10;

    this.emit('response:failed', { peerId, reason });
    this.checkAndUpdateScore(peerId);
  }

  private checkAndUpdateScore(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    if (peer.score <= this.config.banThreshold && !peer.isBanned) {
      this.banPeer(peerId, 'Score threshold exceeded', false);
    } else if (peer.score < this.config.minScoreThreshold && !peer.isBanned) {
      this.emit('peer:unreliable', { peerId, score: peer.score });
    }
  }

  banPeer(peerId: string, reason: string, permanent: boolean = false): void {
    const peer = this.initializePeer(peerId);
    peer.isBanned = true;
    peer.banReason = reason;

    const banEntry: BanListEntry = {
      peerId,
      reason,
      timestamp: Date.now(),
      permanent,
      expiresAt: permanent ? undefined : Date.now() + this.config.tempBanDurationMs,
    };

    this.banList.set(peerId, banEntry);
    this.emit('peer:banned', banEntry);

    if (this.peers.has(peerId)) {
      peer.banReason = reason;
      peer.bannedUntil = banEntry.expiresAt;
    }
  }

  unbanPeer(peerId: string): boolean {
    if (!this.banList.has(peerId)) {
      return false;
    }

    const banEntry = this.banList.get(peerId);
    if (banEntry?.permanent) {
      return false;
    }

    this.banList.delete(peerId);
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.isBanned = false;
      peer.banReason = undefined;
      peer.bannedUntil = undefined;
    }

    this.emit('peer:unbanned', { peerId });
    return true;
  }

  isBanned(peerId: string): boolean {
    const banEntry = this.banList.get(peerId);
    if (!banEntry) return false;

    if (banEntry.permanent) return true;
    if (banEntry.expiresAt && Date.now() >= banEntry.expiresAt) {
      this.unbanPeer(peerId);
      return false;
    }

    return true;
  }

  getPeerScore(peerId: string): number {
    const peer = this.peers.get(peerId);
    return peer ? peer.score : 0;
  }

  getPeerMetrics(peerId: string): PeerMetrics | null {
    return this.peers.get(peerId) || null;
  }

  getAverageLatency(peerId: string): number {
    const peer = this.peers.get(peerId