```typescript
import { EventEmitter } from 'events';
import { WebSocket, Server as WebSocketServer } from 'ws';
import { Logger } from '../utils/Logger';
import { BlockHeader } from '../types/block';
import { Transaction } from '../types/transaction';
import { Log } from '../types/log';

interface Subscriber {
  id: string;
  ws: WebSocket;
  subscriptions: Map<string, SubscriptionData>;
  isAlive: boolean;
}

interface SubscriptionData {
  type: 'newHeads' | 'logs' | 'pendingTransactions';
  filters?: LogFilter;
  createdAt: number;
}

interface LogFilter {
  address?: string | string[];
  topics?: (string | string[] | null)[];
  fromBlock?: string | number;
  toBlock?: string | number;
}

interface RpcMessage {
  jsonrpc: '2.0';
  method: string;
  params?: unknown[];
  id?: string | number;
}

interface RpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id?: string | number;
}

export class SubscriptionManager {
  private wss: WebSocketServer;
  private subscribers: Map<string, Subscriber>;
  private eventEmitter: EventEmitter;
  private logger: Logger;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscriptionCounter: number = 0;

  constructor(server: any, logger: Logger) {
    this.logger = logger;
    this.subscribers = new Map();
    this.eventEmitter = new EventEmitter();
    this.wss = new WebSocketServer({ server });
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const subscriberId = this.generateSubscriberId();
      const subscriber: Subscriber = {
        id: subscriberId,
        ws,
        subscriptions: new Map(),
        isAlive: true,
      };

      this.subscribers.set(subscriberId, subscriber);
      this.logger.info(`WebSocket connection established: ${subscriberId}`);

      ws.on('message', (data: Buffer) => {
        this.handleMessage(subscriberId, data);
      });

      ws.on('pong', () => {
        const subscriber = this.subscribers.get(subscriberId);
        if (subscriber) {
          subscriber.isAlive = true;
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(subscriberId);
      });

      ws.on('error', (error: Error) => {
        this.logger.error(`WebSocket error for ${subscriberId}: ${error.message}`);
        this.handleDisconnect(subscriberId);
      });
    });
  }

  private handleMessage(subscriberId: string, data: Buffer): void {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) {
      return;
    }

    try {
      const message: RpcMessage = JSON.parse(data.toString());
      this.processRpcMessage(subscriberId, message);
    } catch (error) {
      const response: RpcResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error',
        },
      };
      this.sendToSubscriber(subscriberId, response);
    }
  }

  private processRpcMessage(subscriberId: string, message: RpcMessage): void {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) {
      return;
    }

    if (message.method === 'eth_subscribe') {
      this.handleSubscribe(subscriberId, message);
    } else if (message.method === 'eth_unsubscribe') {
      this.handleUnsubscribe(subscriberId, message);
    } else {
      const response: RpcResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: 'Method not found',
        },
        id: message.id,
      };
      this.sendToSubscriber(subscriberId, response);
    }
  }

  private handleSubscribe(subscriberId: string, message: RpcMessage): void {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) {
      return;
    }

    const [type, ...filters] = message.params as unknown[];

    if (typeof type !== 'string') {
      const response: RpcResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: 'Invalid params',
        },
        id: message.id,
      };
      this.sendToSubscriber(subscriberId, response);
      return;
    }

    if (!['newHeads', 'logs', 'pendingTransactions'].includes(type)) {
      const response: RpcResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: 'Invalid subscription type',
        },
        id: message.id,
      };
      this.sendToSubscriber(subscriberId, response);
      return;
    }

    const subscriptionId = this.generateSubscriptionId();
    const subscriptionData: SubscriptionData = {
      type: type as 'newHeads' | 'logs' | 'pendingTransactions',
      createdAt: Date.now(),
    };

    if (type === 'logs' && filters.length > 0 && typeof filters[0] === 'object') {
      subscriptionData.filters = filters[0] as LogFilter;
    }

    subscriber.subscriptions.set(subscriptionId, subscriptionData);

    const response: RpcResponse = {
      jsonrpc: '2.0',
      result: subscriptionId,
      id: message.id,
    };
    this.sendToSubscriber(subscriberId, response);

    this.logger.info(
      `Subscription ${subscriptionId} created for ${type} on ${subscriberId}`
    );
  }

  private handleUnsubscribe(subscriberId: string, message: RpcMessage): void {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) {
      return;
    }

    const [subscriptionId] = message.params as [string];

    const removed = subscriber.subscriptions.delete(subscriptionId);

    const response: RpcResponse = {
      jsonrpc: '2.0',
      result: removed,
      id: message.id,
    };
    this.sendToSubscriber(subscriberId, response);

    if (removed) {
      this.logger.info(`Subscription ${subscriptionId} removed for ${subscriberId}`);
    }
  }

  private handleDisconnect(subscriberId: string): void {
    const subscriber = this.subscribers.get(subscriberId);
    if (subscriber) {
      this.logger.info(
        `WebSocket disconnected: ${subscriberId} (${subscriber.subscriptions.size} active subscriptions)`
      );
      this.subscribers.delete(subscriberId);
    }
  }

  public notifyNewHead(blockHeader: BlockHeader): void {
    const notification = {
      jsonrpc: '2.0',
      method: 'eth_subscription',
      params: {
        subscription: null,
        result: this.formatBlockHeader(blockHeader),
      },
    };

    this.broadcastByType('newHeads', notification);
  }

  public notifyLogs(logs: Log[]): void {
    for (const log of logs) {
      const notification = {
        jsonrpc: '2.0',
        method: 'eth_subscription',
        params: {
          subscription: null,
          result: this.formatLog(log),
        },
      };

      this.broadcastByTypeWithFilter('logs', notification, log);
    }
  }

  public notifyPendingTransaction(transaction: Transaction): void {
    const notification = {
      jsonrpc