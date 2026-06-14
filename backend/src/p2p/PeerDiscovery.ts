```typescript
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

interface PeerInfo {
  nodeId: string;
  host: string;
  port: number;
  lastSeen: number;
  rpcPort?: number;
}

interface KBucket {
  peers: PeerInfo[];
  lastUpdated: number;
}

interface LookupResult {
  peers: PeerInfo[];
  distance: bigint;
}

class PeerDiscovery extends EventEmitter {
  private nodeId: string;
  private kBuckets: Map<number, KBucket>;
  private bootstrapNodes: PeerInfo[];
  private routingTable: Map<string, PeerInfo>;
  private k: number = 20;
  private alpha: number = 3;
  private bucketSize: number = 20;
  private maxNodeIdBits: number = 256;
  private peersLookupCache: Map<string, LookupResult>;
  private cacheTTL: number = 3600000;
  private peerTimeout: number = 600000;

  constructor(nodeId?: string, bootstrapNodes?: PeerInfo[]) {
    super();
    
    this.nodeId = nodeId || this.generateNodeId();
    this.kBuckets = new Map();
    this.routingTable = new Map();
    this.peersLookupCache = new Map();
    this.bootstrapNodes = bootstrapNodes || [];
    
    this.initializeBuckets();
  }

  private generateNodeId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private initializeBuckets(): void {
    for (let i = 0; i < this.maxNodeIdBits; i++) {
      this.kBuckets.set(i, {
        peers: [],
        lastUpdated: Date.now(),
      });
    }
  }

  private calculateDistance(id1: string, id2: string): bigint {
    const buffer1 = Buffer.from(id1, 'hex');
    const buffer2 = Buffer.from(id2, 'hex');
    
    let distance = 0n;
    for (let i = 0; i < buffer1.length; i++) {
      const xor = buffer1[i] ^ buffer2[i];
      distance = (distance << 8n) | BigInt(xor);
    }
    
    return distance;
  }

  private getBucketIndex(peerId: string): number {
    const distance = this.calculateDistance(this.nodeId, peerId);
    
    if (distance === 0n) {
      return 0;
    }
    
    const bitLength = distance.toString(2).length;
    return Math.min(bitLength - 1, this.maxNodeIdBits - 1);
  }

  public addPeer(peer: PeerInfo): void {
    const bucketIndex = this.getBucketIndex(peer.nodeId);
    const bucket = this.kBuckets.get(bucketIndex);

    if (!bucket) {
      return;
    }

    const existingPeerIndex = bucket.peers.findIndex(
      (p) => p.nodeId === peer.nodeId
    );

    if (existingPeerIndex !== -1) {
      bucket.peers[existingPeerIndex] = {
        ...bucket.peers[existingPeerIndex],
        lastSeen: Date.now(),
      };
    } else if (bucket.peers.length < this.bucketSize) {
      bucket.peers.push({
        ...peer,
        lastSeen: Date.now(),
      });
    } else {
      const lastPeer = bucket.peers[0];
      const isAlive = this.isPeerAlive(lastPeer);

      if (!isAlive) {
        bucket.peers.shift();
        bucket.peers.push({
          ...peer,
          lastSeen: Date.now(),
        });
      }
    }

    this.routingTable.set(peer.nodeId, peer);
    bucket.lastUpdated = Date.now();
    this.emit('peer:added', peer);
  }

  private isPeerAlive(peer: PeerInfo): boolean {
    const timeSinceLastSeen = Date.now() - peer.lastSeen;
    return timeSinceLastSeen < this.peerTimeout;
  }

  public removePeer(peerId: string): void {
    const bucketIndex = this.getBucketIndex(peerId);
    const bucket = this.kBuckets.get(bucketIndex);

    if (!bucket) {
      return;
    }

    const peerIndex = bucket.peers.findIndex((p) => p.nodeId === peerId);
    if (peerIndex !== -1) {
      bucket.peers.splice(peerIndex, 1);
      this.routingTable.delete(peerId);
      this.emit('peer:removed', peerId);
    }
  }

  public async lookup(targetId: string): Promise<PeerInfo[]> {
    const cacheKey = `lookup:${targetId}`;
    const cached = this.peersLookupCache.get(cacheKey);

    if (cached && Date.now() - cached.distance < this.cacheTTL) {
      return cached.peers;
    }

    const closestPeers = this.getClosestPeers(targetId, this.k);
    const visited = new Set<string>();
    const candidates: PeerInfo[] = [...closestPeers];

    while (candidates.length > 0) {
      const querying = candidates.splice(0, this.alpha);

      for (const peer of querying) {
        if (visited.has(peer.nodeId)) {
          continue;
        }

        visited.add(peer.nodeId);

        try {
          const newPeers = await this.queryPeer(peer, targetId);

          for (const newPeer of newPeers) {
            if (!visited.has(newPeer.nodeId)) {
              candidates.push(newPeer);
            }
          }

          const distance = this.calculateDistance(newPeer.nodeId, targetId);
          this.peersLookupCache.set(cacheKey, {
            peers: this.getClosestPeers(targetId, this.k),
            distance,
          });
        } catch (error) {
          this.emit('query:error', { peer, error });
        }
      }
    }

    const result = this.getClosestPeers(targetId, this.k);
    this.peersLookupCache.set(cacheKey, {
      peers: result,
      distance: this.calculateDistance(result[0]?.nodeId || '', targetId),
    });

    return result;
  }

  private getClosestPeers(targetId: string, count: number): PeerInfo[] {
    const peers = Array.from(this.routingTable.values());

    return peers
      .sort((a, b) => {
        const distA = this.calculateDistance(a.nodeId, targetId);
        const distB = this.calculateDistance(b.nodeId, targetId);
        return distA < distB ? -1 : 1;
      })
      .slice(0, count);
  }

  private async queryPeer(peer: PeerInfo, targetId: string): Promise<PeerInfo[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Query timeout for peer ${peer.nodeId}`));
      }, 5000);

      this.emit('peer:query', { peer, targetId }, (response: PeerInfo[] | null) => {
        clearTimeout(timeout);

        if (response) {
          resolve(response);
        } else {
          reject(new Error(`No response from peer ${peer.nodeId}`));
        }
      });
    });
  }

  public async bootstrap(): Promise<void> {
    if (this.bootstrapNodes.length === 0) {
      this.emit('bootstrap:warning', 'No bootstrap nodes configured');
      return;
    }

    for (const bootstrapNode of this.bootstrapNodes) {
      try {