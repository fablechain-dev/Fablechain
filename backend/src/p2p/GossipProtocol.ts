```typescript
import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import pino from 'pino';

export interface GossipMessage {
  id: string;
  sender: string;
  payload: Buffer;
  timestamp: number;
  nonce: number;
}

export interface GossipConfig {
  fanout: number;
  maxSeenSetSize: number;
  decayInterval: number;
  decayFactor: number;
  messageTimeout: number;
  validationFn?: (msg: GossipMessage) => Promise<boolean>;
}

export interface PeerConnection {
  peerId: string;
  isActive: boolean;
  send(msg: GossipMessage): Promise<void>;
  close(): void;
}

interface SeenMessageEntry {
  hash: string;
  timestamp: number;
  decayCount: number;
}

export class GossipProtocol extends EventEmitter {
  private config: GossipConfig;
  private logger: pino.Logger;
  private peers: Map<string, PeerConnection>;
  private seenMessages: Map<string, SeenMessageEntry>;
  private messageQueue: Map<string, GossipMessage>;
  private decayTimer: NodeJS.Timeout | null = null;
  private peerId: string;

  constructor(peerId: string, config: Partial<GossipConfig> = {}) {
    super();
    this.peerId = peerId;
    this.logger = pino({ name: 'GossipProtocol' });
    
    this.config = {
      fanout: 8,
      maxSeenSetSize: 10000,
      decayInterval: 60000,
      decayFactor: 0.9,
      messageTimeout: 300000,
      ...config,
    };

    this.peers = new Map();
    this.seenMessages = new Map();
    this.messageQueue = new Map();

    this.startDecayTimer();
  }

  public addPeer(connection: PeerConnection): void {
    if (this.peers.has(connection.peerId)) {
      this.logger.warn(
        { peerId: connection.peerId },
        'Peer already connected, replacing'
      );
      this.peers.get(connection.peerId)?.close();
    }

    this.peers.set(connection.peerId, connection);
    this.logger.info(
      { peerId: connection.peerId, totalPeers: this.peers.size },
      'Peer added to gossip network'
    );
  }

  public removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.close();
      this.peers.delete(peerId);
      this.logger.info(
        { peerId, totalPeers: this.peers.size },
        'Peer removed from gossip network'
      );
    }
  }

  public async publishMessage(payload: Buffer, nonce: number = 0): Promise<void> {
    const messageHash = this.hashMessage(payload);
    
    if (this.isDuplicate(messageHash)) {
      this.logger.debug({ hash: messageHash }, 'Message already seen, skipping');
      return;
    }

    const message: GossipMessage = {
      id: this.generateMessageId(),
      sender: this.peerId,
      payload,
      timestamp: Date.now(),
      nonce,
    };

    this.recordSeenMessage(messageHash);
    await this.propagateMessage(message);
    this.emit('message', message);
  }

  public async receiveMessage(message: GossipMessage): Promise<void> {
    const messageHash = this.hashMessage(message.payload);

    if (this.isDuplicate(messageHash)) {
      this.logger.debug(
        { messageId: message.id, hash: messageHash },
        'Duplicate message received'
      );
      return;
    }

    if (Date.now() - message.timestamp > this.config.messageTimeout) {
      this.logger.warn(
        { messageId: message.id },
        'Message expired, discarding'
      );
      return;
    }

    if (this.config.validationFn) {
      try {
        const isValid = await this.config.validationFn(message);
        if (!isValid) {
          this.logger.warn(
            { messageId: message.id, sender: message.sender },
            'Message validation failed'
          );
          return;
        }
      } catch (error) {
        this.logger.error(
          { messageId: message.id, error },
          'Message validation error'
        );
        return;
      }
    }

    this.recordSeenMessage(messageHash);
    await this.propagateMessage(message);
    this.emit('message', message);

    this.logger.debug(
      { messageId: message.id, sender: message.sender },
      'Message received and propagated'
    );
  }

  private async propagateMessage(message: GossipMessage): Promise<void> {
    const activePeers = Array.from(this.peers.values()).filter(p => p.isActive);

    if (activePeers.length === 0) {
      this.logger.debug('No active peers available for gossip propagation');
      return;
    }

    const fanout = Math.min(this.config.fanout, activePeers.length);
    const selectedPeers = this.selectRandomPeers(activePeers, fanout);

    const sendPromises = selectedPeers.map(peer =>
      this.sendToPeer(peer, message)
    );

    const results = await Promise.allSettled(sendPromises);

    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      this.logger.warn(
        { messageId: message.id, failed, total: selectedPeers.length },
        'Some gossip sends failed'
      );
    }
  }

  private async sendToPeer(
    peer: PeerConnection,
    message: GossipMessage
  ): Promise<void> {
    try {
      await peer.send(message);
    } catch (error) {
      this.logger.error(
        { peerId: peer.peerId, messageId: message.id, error },
        'Failed to send message to peer'
      );
      throw error;
    }
  }

  private selectRandomPeers(
    peers: PeerConnection[],
    count: number
  ): PeerConnection[] {
    const shuffled = [...peers].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private recordSeenMessage(hash: string): void {
    if (this.seenMessages.size >= this.config.maxSeenSetSize) {
      this.pruneLeastRecentlyUsed();
    }

    this.seenMessages.set(hash, {
      hash,
      timestamp: Date.now(),
      decayCount: 0,
    });
  }

  private isDuplicate(hash: string): boolean {
    return this.seenMessages.has(hash);
  }

  private hashMessage(payload: Buffer): string {
    return createHash('sha256').update(payload).digest('hex');
  }

  private generateMessageId(): string {
    return `${this.peerId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private pruneLeastRecentlyUsed(): void {
    const entries = Array.from(this.seenMessages.values());
    entries.sort((a, b) => a.timestamp - b.timestamp);

    const pruneCount = Math.ceil(this.config.maxSeenSetSize * 0.1);
    for (let i = 0; i < pruneCount; i++) {
      this.seenMessages.delete(entries[i].hash);
    }

    this.logger.debug(
      { pruned: pruneCount, remaining: this.seenMessages.size },
      'Seen set pruned'
    );
  }

  private