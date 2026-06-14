```typescript
import { GossipProtocol } from '../../src/p2p/GossipProtocol';
import { Message, MessageType } from '../../src/p2p/types';
import { EventEmitter } from 'events';

describe('GossipProtocol', () => {
  let gossipProtocol: GossipProtocol;
  let mockPeer1: EventEmitter;
  let mockPeer2: EventEmitter;
  let mockPeer3: EventEmitter;
  let mockPeers: Map<string, EventEmitter>;

  beforeEach(() => {
    mockPeer1 = new EventEmitter();
    mockPeer2 = new EventEmitter();
    mockPeer3 = new EventEmitter();

    mockPeers = new Map([
      ['peer1', mockPeer1],
      ['peer2', mockPeer2],
      ['peer3', mockPeer3],
    ]);

    gossipProtocol = new GossipProtocol({
      peerId: 'testNode',
      fanout: 2,
      messageExpirySec: 300,
      deduplicationWindow: 1000,
    });

    gossipProtocol.setPeers(mockPeers);
  });

  describe('Message Deduplication', () => {
    it('should deduplicate identical messages', (done) => {
      const message: Message = {
        id: 'msg-1',
        type: MessageType.BLOCK,
        payload: Buffer.from('block-data'),
        timestamp: Date.now(),
        source: 'peer1',
      };

      let broadcastCount = 0;
      gossipProtocol.on('messageReceived', () => {
        broadcastCount++;
      });

      gossipProtocol.receiveMessage(message);
      gossipProtocol.receiveMessage(message);

      setTimeout(() => {
        expect(broadcastCount).toBe(1);
        done();
      }, 100);
    });

    it('should track message hashes in dedup cache', (done) => {
      const message: Message = {
        id: 'msg-2',
        type: MessageType.TRANSACTION,
        payload: Buffer.from('tx-data'),
        timestamp: Date.now(),
        source: 'peer2',
      };

      gossipProtocol.receiveMessage(message);
      const isDuplicate = gossipProtocol.isDuplicate(message.id);

      expect(isDuplicate).toBe(true);
      done();
    });

    it('should clear expired entries from dedup cache', (done) => {
      const message: Message = {
        id: 'msg-3',
        type: MessageType.BLOCK,
        payload: Buffer.from('block-data'),
        timestamp: Date.now(),
        source: 'peer1',
      };

      gossipProtocol.receiveMessage(message);
      expect(gossipProtocol.isDuplicate(message.id)).toBe(true);

      jest.advanceTimersByTime(1100);

      expect(gossipProtocol.isDuplicate(message.id)).toBe(false);
      done();
    }, 5000);

    it('should handle concurrent duplicate detection correctly', async () => {
      const message: Message = {
        id: 'msg-concurrent',
        type: MessageType.TRANSACTION,
        payload: Buffer.from('tx-data'),
        timestamp: Date.now(),
        source: 'peer1',
      };

      const promises = Array(10)
        .fill(null)
        .map(() => Promise.resolve(gossipProtocol.receiveMessage(message)));

      await Promise.all(promises);
      const isDuplicate = gossipProtocol.isDuplicate(message.id);

      expect(isDuplicate).toBe(true);
    });
  });

  describe('Fanout Count', () => {
    it('should respect fanout limit when broadcasting', (done) => {
      const message: Message = {
        id: 'msg-fanout',
        type: MessageType.BLOCK,
        payload: Buffer.from('block-data'),
        timestamp: Date.now(),
        source: 'peer0',
      };

      const sentPeers: string[] = [];

      mockPeer1.on('gossip', () => sentPeers.push('peer1'));
      mockPeer2.on('gossip', () => sentPeers.push('peer2'));
      mockPeer3.on('gossip', () => sentPeers.push('peer3'));

      gossipProtocol.broadcast(message);

      setTimeout(() => {
        expect(sentPeers.length).toBeLessThanOrEqual(2);
        done();
      }, 100);
    });

    it('should select random peers for fanout', (done) => {
      const message: Message = {
        id: 'msg-random',
        type: MessageType.TRANSACTION,
        payload: Buffer.from('tx-data'),
        timestamp: Date.now(),
        source: 'peer0',
      };

      const broadcastCounts: Record<string, number> = {
        peer1: 0,
        peer2: 0,
        peer3: 0,
      };

      mockPeer1.on('gossip', () => broadcastCounts.peer1++);
      mockPeer2.on('gossip', () => broadcastCounts.peer2++);
      mockPeer3.on('gossip', () => broadcastCounts.peer3++);

      for (let i = 0; i < 10; i++) {
        const msg: Message = {
          ...message,
          id: `msg-random-${i}`,
        };
        gossipProtocol.broadcast(msg);
      }

      setTimeout(() => {
        const receivedByAtLeastTwo =
          Object.values(broadcastCounts).filter((count) => count > 0).length >=
          2;
        expect(receivedByAtLeastTwo).toBe(true);
        done();
      }, 200);
    });

    it('should handle fanout of 1', (done) => {
      const singleFanoutProtocol = new GossipProtocol({
        peerId: 'testNode',
        fanout: 1,
        messageExpirySec: 300,
        deduplicationWindow: 1000,
      });

      singleFanoutProtocol.setPeers(mockPeers);

      const sentPeers: string[] = [];

      mockPeer1.on('gossip', () => sentPeers.push('peer1'));
      mockPeer2.on('gossip', () => sentPeers.push('peer2'));
      mockPeer3.on('gossip', () => sentPeers.push('peer3'));

      const message: Message = {
        id: 'msg-single-fanout',
        type: MessageType.BLOCK,
        payload: Buffer.from('block-data'),
        timestamp: Date.now(),
        source: 'peer0',
      };

      singleFanoutProtocol.broadcast(message);

      setTimeout(() => {
        expect(sentPeers.length).toBe(1);
        done();
      }, 100);
    });

    it('should not broadcast to source peer', (done) => {
      const message: Message = {
        id: 'msg-no-source',
        type: MessageType.TRANSACTION,
        payload: Buffer.from('tx-data'),
        timestamp: Date.now(),
        source: 'peer1',
      };

      let sourcePeerReceived = false;

      mockPeer1.on('gossip', () => {
        sourcePeerReceived = true;
      });

      gossipProtocol.broadcast(message);

      setTimeout(() => {
        expect(sourcePeerReceived).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Message Expiry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should expire messages after TT