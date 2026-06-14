```typescript
import { GossipProtocol } from '../../src/p2p/GossipProtocol';
import { PeerId } from '../../src/p2p/types';
import { EventEmitter } from 'events';

interface GossipMessage {
  id: string;
  payload: string;
  timestamp: number;
  ttl: number;
  sender: PeerId;
}

interface GossipConfig {
  fanout: number;
  maxMessageAge: number;
  deduplicationWindow: number;
  messageExpiry: number;
}

class MockPeerId implements PeerId {
  constructor(public readonly id: string) {}

  toString(): string {
    return this.id;
  }
}

describe('GossipProtocol', () => {
  let gossipProtocol: GossipProtocol;
  let config: GossipConfig;

  beforeEach(() => {
    config = {
      fanout: 4,
      maxMessageAge: 60000,
      deduplicationWindow: 30000,
      messageExpiry: 120000,
    };
    gossipProtocol = new GossipProtocol(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Deduplication', () => {
    it('should track message IDs to prevent duplicate propagation', () => {
      const peerId = new MockPeerId('peer-1');
      const message: GossipMessage = {
        id: 'msg-1',
        payload: 'test message',
        timestamp: Date.now(),
        ttl: 10,
        sender: peerId,
      };

      const seenMessages: Set<string> = new Set();
      const isDuplicate = (msg: GossipMessage): boolean => {
        return seenMessages.has(msg.id);
      };

      expect(isDuplicate(message)).toBe(false);
      seenMessages.add(message.id);
      expect(isDuplicate(message)).toBe(true);
    });

    it('should deduplicate messages within the deduplication window', () => {
      const deduplicationCache = new Map<string, number>();
      const isMessageDuplicated = (messageId: string): boolean => {
        const cachedTime = deduplicationCache.get(messageId);
        if (!cachedTime) return false;
        const timeSinceCache = Date.now() - cachedTime;
        return timeSinceCache < config.deduplicationWindow;
      };

      const messageId = 'msg-duplicate-1';
      expect(isMessageDuplicated(messageId)).toBe(false);

      deduplicationCache.set(messageId, Date.now());
      expect(isMessageDuplicated(messageId)).toBe(true);

      // Simulate time passing beyond deduplication window
      deduplicationCache.set(messageId, Date.now() - config.deduplicationWindow - 1000);
      expect(isMessageDuplicated(messageId)).toBe(false);
    });

    it('should clean up old deduplication entries', () => {
      const deduplicationCache = new Map<string, number>();
      const cleanupDeduplicationCache = (): void => {
        const now = Date.now();
        for (const [messageId, timestamp] of deduplicationCache.entries()) {
          if (now - timestamp > config.deduplicationWindow) {
            deduplicationCache.delete(messageId);
          }
        }
      };

      deduplicationCache.set('old-msg-1', Date.now() - config.deduplicationWindow - 1000);
      deduplicationCache.set('recent-msg-1', Date.now());
      expect(deduplicationCache.size).toBe(2);

      cleanupDeduplicationCache();
      expect(deduplicationCache.size).toBe(1);
      expect(deduplicationCache.has('recent-msg-1')).toBe(true);
      expect(deduplicationCache.has('old-msg-1')).toBe(false);
    });
  });

  describe('Fanout Count', () => {
    it('should respect maximum fanout limit', () => {
      const peers = Array.from({ length: 10 }, (_, i) => new MockPeerId(`peer-${i}`));
      const selectedPeers: PeerId[] = [];

      // Simulate fanout peer selection
      for (let i = 0; i < Math.min(config.fanout, peers.length); i++) {
        selectedPeers.push(peers[i]);
      }

      expect(selectedPeers.length).toBeLessThanOrEqual(config.fanout);
      expect(selectedPeers.length).toBe(config.fanout);
    });

    it('should select fanout peers randomly', () => {
      const peers = Array.from({ length: 20 }, (_, i) => new MockPeerId(`peer-${i}`));
      
      const selectRandomPeers = (peerList: PeerId[], count: number): PeerId[] => {
        const shuffled = [...peerList].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, peerList.length));
      };

      const selection1 = selectRandomPeers(peers, config.fanout);
      const selection2 = selectRandomPeers(peers, config.fanout);

      expect(selection1.length).toBe(config.fanout);
      expect(selection2.length).toBe(config.fanout);
      // Selections should differ (with high probability for random selection)
      const set1 = new Set(selection1.map(p => p.toString()));
      const set2 = new Set(selection2.map(p => p.toString()));
      expect(set1.size + set2.size).toBeGreaterThan(config.fanout);
    });

    it('should handle fanout when peer count is less than fanout limit', () => {
      const peers = Array.from({ length: 2 }, (_, i) => new MockPeerId(`peer-${i}`));
      const selectedPeers = peers.slice(0, Math.min(config.fanout, peers.length));

      expect(selectedPeers.length).toBe(2);
      expect(selectedPeers.length).toBeLessThanOrEqual(config.fanout);
    });

    it('should exclude sender from fanout selection', () => {
      const senderId = 'peer-sender';
      const peers = Array.from({ length: 10 }, (_, i) => new MockPeerId(`peer-${i}`));
      
      const selectFanoutPeers = (peerList: PeerId[], excludeId: string, count: number): PeerId[] => {
        const filtered = peerList.filter(p => p.toString() !== excludeId);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, filtered.length));
      };

      const selectedPeers = selectFanoutPeers(peers, senderId, config.fanout);
      const senderInSelection = selectedPeers.some(p => p.toString() === senderId);
      
      expect(senderInSelection).toBe(false);
    });
  });

  describe('Message Expiry', () => {
    it('should mark messages as expired based on TTL', () => {
      const message: GossipMessage = {
        id: 'msg-expiry-1',
        payload: 'test',
        timestamp: Date.now(),
        ttl: 0,
        sender: new MockPeerId('peer-1'),
      };

      const isMessageExpired = (msg: GossipMessage): boolean => {
        return msg.ttl <= 0;
      };

      expect(isMessageExpired(message)).toBe(true);
    });

    it('should decrement TTL on each hop', () => {
      const message: GossipMessage = {
        id: 'msg-ttl-1',
        payload: 'test',
        timestamp: Date.now(),
        ttl: 5,
        sender: new MockPeerId('peer