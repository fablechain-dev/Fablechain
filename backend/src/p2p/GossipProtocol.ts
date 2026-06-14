```typescript
import { EventEmitter } from 'events';
import crypto from 'crypto';
import { Logger } from '../utils/Logger';
import { PeerConnection } from './PeerConnection';
import { Message, GossipMessage, MessageType } from '../types/Message';

interface GossipConfig {
  fanout: number;
  maxSeenSetSize: number;
  seenSetDecayInterval: number;
  seenSetDecayFactor: number;
  messageTimeout: number;
  duplicateWindow: number;
}

interface SeenMessageEntry {
  hash: string;
  timestamp: number;
  count: number;
}

interface PendingMessage {
  message: GossipMessage;
  timestamp: number;
  originPeerId: string;
}

export class GossipProtocol extends EventEmitter {
  private peers: Map<string, PeerConnection> = new Map();
  private seenMessages: Map<string, SeenMessageEntry> = new Map();
  private pendingMessages: Map<string, PendingMessage> = new Map();
  private logger: Logger;
  private config: GossipConfig;
  private decayInterval: NodeJS.Timeout | null = null;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<GossipConfig> = {}) {
    super();
    this.logger = new Logger('GossipProtocol');
    this.config = {
      fanout: config.fanout ?? 5,
      maxSeenSetSize: config.maxSeenSetSize ?? 10000,
      seenSetDecayInterval: config.seenSetDecayInterval ?? 60000,
      seenSetDecayFactor: config.seenSetDecayFactor ?? 0.95,
      messageTimeout: config.messageTimeout ?? 30000,
      duplicateWindow: config.duplicateWindow ?? 5000,
    };
  }

  public start(): void {
    this.startDecayInterval();
    this.startProcessingInterval();
    this.logger.info('Gossip protocol started', {
      fanout: this.config.fanout,
      maxSeenSetSize: this.config.maxSeenSetSize,
    });
  }

  public stop(): void {
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
      this.decayInterval = null;
    }
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.logger.info('Gossip protocol stopped');
  }

  public addPeer(peerId: string, connection: PeerConnection): void {
    if (this.peers.has(peerId)) {
      this.logger.warn('Peer already exists', { peerId });
      return;
    }

    this.peers.set(peerId, connection);
    connection.on('message', (message: GossipMessage) => {
      this.handleIncomingMessage(message, peerId);
    });

    this.logger.debug('Peer added', { peerId, totalPeers: this.peers.size });
  }

  public removePeer(peerId: string): void {
    const connection = this.peers.get(peerId);
    if (connection) {
      connection.removeAllListeners('message');
      this.peers.delete(peerId);
      this.logger.debug('Peer removed', { peerId, totalPeers: this.peers.size });
    }
  }

  public async publishMessage(message: Message): Promise<void> {
    const gossipMessage: GossipMessage = {
      id: this.generateMessageId(),
      type: message.type,
      payload: message.payload,
      timestamp: Date.now(),
      originPeerId: 'self',
      hash: '',
      ttl: 32,
    };

    gossipMessage.hash = this.computeMessageHash(gossipMessage);

    this.recordSeenMessage(gossipMessage.hash);
    await this.pushGossip(gossipMessage, 'self');

    this.emit('published', gossipMessage);
    this.logger.debug('Message published', { messageId: gossipMessage.id });
  }

  private async handleIncomingMessage(
    message: GossipMessage,
    originPeerId: string
  ): Promise<void> {
    const messageHash = message.hash || this.computeMessageHash(message);

    if (this.hasSeen(messageHash)) {
      this.logger.debug('Duplicate message received', {
        messageId: message.id,
        peerId: originPeerId,
      });
      this.incrementSeenCount(messageHash);
      return;
    }

    if (message.ttl <= 0) {
      this.logger.debug('Message TTL expired', { messageId: message.id });
      return;
    }

    this.recordSeenMessage(messageHash);
    this.emit('received', message);

    message.ttl--;
    await this.pushGossip(message, originPeerId);

    this.logger.debug('Message relayed', {
      messageId: message.id,
      ttl: message.ttl,
    });
  }

  private async pushGossip(
    message: GossipMessage,
    originPeerId: string
  ): Promise<void> {
    const targetPeers = this.selectPeersForGossip(originPeerId);

    if (targetPeers.length === 0) {
      this.logger.debug('No peers available for gossip');
      return;
    }

    const pushPromises = targetPeers.map((peerId) => {
      const connection = this.peers.get(peerId);
      if (!connection) {
        return Promise.resolve();
      }

      return connection
        .sendMessage(message)
        .catch((error) => {
          this.logger.warn('Failed to send gossip message', {
            peerId,
            messageId: message.id,
            error: error instanceof Error ? error.message : String(error),
          });
        });
    });

    await Promise.all(pushPromises);
  }

  private selectPeersForGossip(originPeerId: string): string[] {
    const availablePeers = Array.from(this.peers.keys()).filter(
      (peerId) => peerId !== originPeerId
    );

    if (availablePeers.length <= this.config.fanout) {
      return availablePeers;
    }

    const selectedPeers: string[] = [];
    const shuffled = this.shuffleArray(availablePeers);

    for (let i = 0; i < this.config.fanout && i < shuffled.length; i++) {
      selectedPeers.push(shuffled[i]);
    }

    return selectedPeers;
  }

  private computeMessageHash(message: GossipMessage | Message): string {
    const content = JSON.stringify({
      type: message.type,
      payload: message.payload,
      timestamp: 'timestamp' in message ? message.timestamp : Date.now(),
    });

    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private recordSeenMessage(hash: string): void {
    const now = Date.now();

    if (this.seenMessages.has(hash)) {
      const entry = this.seenMessages.get(hash)!;
      entry.timestamp = now;
      entry.count++;
      return;
    }

    this.seenMessages.set(hash, {
      hash,
      timestamp: now,
      count: 1,
    });

    if (this.seenMessages.size > this.config.maxSeenSetSize) {
      this.pruneSeenSet();
    }
  }

  private incrementSeenCount(hash: string): void {
    const entry = this.seenMessages.get(hash);
    if (entry) {
      entry.count++;
      entry.timestamp = Date.now();
    }
  }

  private hasSeen(hash: string): boolean {
    const entry = this.seenMessages.get(hash);
    if (!entry) {
      return false;
    }