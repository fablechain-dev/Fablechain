```typescript
import EventEmitter from 'events';
import crypto from 'crypto';
import { setTimeout as sleep } from 'timers/promises';

interface PeerNode {
  id: string;
  address: string;
  port: number;
  lastSeen: number;
  distance?: number;
}

interface KBucket {
  nodes: PeerNode[];
  lastUpdated: number;
}

interface LookupResult {
  peers: PeerNode[];
  distance: number;
}

const BUCKET_SIZE = 20;
const MAX_BUCKETS = 160;
const LOOKUP_CONCURRENCY = 3;
const BUCKET_REFRESH_INTERVAL = 3600000;
const NODE_EXPIRATION_TIME = 86400000;
const PING_TIMEOUT = 5000;

export class PeerDiscovery extends EventEmitter {
  private localNodeId: string;
  private buckets: Map<number, KBucket>;
  private peers: Map<string, PeerNode>;
  private bootstrapNodes: PeerNode[];
  private lookupInProgress: Set<string>;
  private refreshTimer: NodeJS.Timeout | null;

  constructor(localNodeId?: string) {
    super();
    this.localNodeId = localNodeId || this.generateNodeId();
    this.buckets = new Map();
    this.peers = new Map();
    this.bootstrapNodes = [];
    this.lookupInProgress = new Set();
    this.refreshTimer = null;

    this.initializeBuckets();
  }

  private generateNodeId(): string {
    return crypto.randomBytes(20).toString('hex');
  }

  private initializeBuckets(): void {
    for (let i = 0; i < MAX_BUCKETS; i++) {
      this.buckets.set(i, {
        nodes: [],
        lastUpdated: Date.now(),
      });
    }
  }

  private calculateDistance(nodeId: string): number {
    const localBuffer = Buffer.from(this.localNodeId, 'hex');
    const targetBuffer = Buffer.from(nodeId, 'hex');

    let distance = 0;
    for (let i = 0; i < Math.min(localBuffer.length, targetBuffer.length); i++) {
      const xor = localBuffer[i] ^ targetBuffer[i];
      if (xor === 0) {
        distance += 8;
      } else {
        distance += 8 - Math.floor(Math.log2(xor));
        break;
      }
    }

    return distance;
  }

  private getBucketIndex(nodeId: string): number {
    const distance = this.calculateDistance(nodeId);
    const bucketIndex = Math.min(distance, MAX_BUCKETS - 1);
    return Math.max(0, bucketIndex);
  }

  public addPeer(peer: PeerNode): boolean {
    const bucketIndex = this.getBucketIndex(peer.id);
    const bucket = this.buckets.get(bucketIndex);

    if (!bucket) {
      return false;
    }

    const existingIndex = bucket.nodes.findIndex(n => n.id === peer.id);

    if (existingIndex !== -1) {
      bucket.nodes[existingIndex].lastSeen = Date.now();
      this.peers.set(peer.id, bucket.nodes[existingIndex]);
      return true;
    }

    if (bucket.nodes.length < BUCKET_SIZE) {
      const newPeer = {
        ...peer,
        lastSeen: Date.now(),
      };
      bucket.nodes.push(newPeer);
      bucket.lastUpdated = Date.now();
      this.peers.set(peer.id, newPeer);
      this.emit('peerAdded', newPeer);
      return true;
    }

    const oldestPeer = bucket.nodes.reduce((oldest, current) =>
      current.lastSeen < oldest.lastSeen ? current : oldest
    );

    return this.replacePeer(oldestPeer.id, peer, bucketIndex);
  }

  private replacePeer(oldPeerId: string, newPeer: PeerNode, bucketIndex: number): boolean {
    const bucket = this.buckets.get(bucketIndex);
    if (!bucket) return false;

    const index = bucket.nodes.findIndex(n => n.id === oldPeerId);
    if (index === -1) return false;

    bucket.nodes[index] = {
      ...newPeer,
      lastSeen: Date.now(),
    };
    bucket.lastUpdated = Date.now();
    this.peers.set(newPeer.id, bucket.nodes[index]);
    this.emit('peerReplaced', newPeer);

    return true;
  }

  public removePeer(peerId: string): boolean {
    const bucketIndex = this.getBucketIndex(peerId);
    const bucket = this.buckets.get(bucketIndex);

    if (!bucket) return false;

    const index = bucket.nodes.findIndex(n => n.id === peerId);
    if (index === -1) return false;

    bucket.nodes.splice(index, 1);
    this.peers.delete(peerId);
    this.emit('peerRemoved', peerId);

    return true;
  }

  public getPeer(peerId: string): PeerNode | undefined {
    return this.peers.get(peerId);
  }

  public getClosestPeers(targetId: string, count: number = BUCKET_SIZE): PeerNode[] {
    const allPeers = Array.from(this.peers.values());

    const peersWithDistance = allPeers.map(peer => ({
      ...peer,
      distance: this.calculateDistance(targetId),
    }));

    return peersWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map(p => {
        const { distance, ...peer } = p;
        return peer;
      });
  }

  public async lookupNode(targetId: string): Promise<LookupResult> {
    if (this.lookupInProgress.has(targetId)) {
      throw new Error(`Lookup for ${targetId} already in progress`);
    }

    this.lookupInProgress.add(targetId);

    try {
      const closestPeers = this.getClosestPeers(targetId, LOOKUP_CONCURRENCY);

      if (closestPeers.length === 0) {
        return {
          peers: [],
          distance: this.calculateDistance(targetId),
        };
      }

      const visited = new Set<string>();
      const candidates = [...closestPeers];
      let nearestPeers = [...closestPeers];

      while (candidates.length > 0) {
        const peer = candidates.shift();
        if (!peer || visited.has(peer.id)) continue;

        visited.add(peer.id);

        try {
          const closerPeers = await this.queryPeer(peer, targetId);
          const newCandidates = closerPeers.filter(p => !visited.has(p.id));

          candidates.push(...newCandidates);
          candidates.sort((a, b) => a.distance! - b.distance!);

          const currentDistance = this.calculateDistance(targetId);
          const newNearest = newCandidates.filter(p => p.distance! <= currentDistance);

          if (newNearest.length > 0) {
            nearestPeers = [...new Set([...nearestPeers, ...newNearest])];
            nearestPeers = nearestPeers
              .sort((a, b) => a.distance! - b.distance!)
              .slice(0, BUCKET_SIZE);
          }
        } catch (error) {
          this.emit('queryError', { peer, error });
          continue;
        }

        if (visited.size >= BUCKET_SIZE) {
          break;
        }
      }

      return {
        peers: nearestPeers.map(p => {
          const { distance, ...peer } = p;
          return peer;