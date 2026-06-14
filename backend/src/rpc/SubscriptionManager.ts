```typescript
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/Logger';
import { BlockService } from '../services/BlockService';
import { MempoolService } from '../services/MempoolService';
import { LogService } from '../services/LogService';

interface SubscriptionRequest {
  jsonrpc: string;
  method: string;
  params: string[];
  id: string | number;
}

interface SubscriptionResponse {
  jsonrpc: string;
  result?: string;
  error?: {
    code: number;
    message: string;
  };
  id: string | number;
}

interface SubscriptionMessage {
  jsonrpc: string;
  method: string;
  params: {
    subscription: string;
    result: unknown;
  };
}

interface ActiveSubscription {
  id: string;
  type: 'newHeads' | 'logs' | 'pendingTransactions';
  ws: WebSocket.WebSocket;
  filter?: Record<string, unknown>;
  createdAt: number;
}

interface BlockHeader {
  hash: string;
  parentHash: string;
  number: string;
  timestamp: string;
  miner: string;
  gasLimit: string;
  gasUsed: string;
  difficulty: string;
}

interface TransactionLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
}

interface PendingTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gas: string;
  nonce: number;
  data: string;
  chainId: number;
}

export class SubscriptionManager extends EventEmitter {
  private subscriptions: Map<string, ActiveSubscription>;
  private logger: Logger;
  private blockService: BlockService;
  private mempoolService: MempoolService;
  private logService: LogService;
  private blockHeaderEmitter: EventEmitter;
  private transactionEmitter: EventEmitter;
  private logEmitter: EventEmitter;
  private maxSubscriptionsPerConnection: number;
  private subscriptionTimeout: number;

  constructor(
    blockService: BlockService,
    mempoolService: MempoolService,
    logService: LogService,
    logger: Logger,
    maxSubscriptionsPerConnection: number = 100,
    subscriptionTimeoutMs: number = 300000,
  ) {
    super();
    this.subscriptions = new Map();
    this.logger = logger;
    this.blockService = blockService;
    this.mempoolService = mempoolService;
    this.logService = logService;
    this.blockHeaderEmitter = new EventEmitter();
    this.transactionEmitter = new EventEmitter();
    this.logEmitter = new EventEmitter();
    this.maxSubscriptionsPerConnection = maxSubscriptionsPerConnection;
    this.subscriptionTimeout = subscriptionTimeoutMs;
    this.initializeInternalListeners();
  }

  private initializeInternalListeners(): void {
    this.blockService.on('newBlock', (block: Record<string, unknown>) => {
      this.broadcastNewHeads(block);
    });

    this.mempoolService.on('transactionAdded', (tx: PendingTransaction) => {
      this.broadcastPendingTransaction(tx);
    });

    this.logService.on('logEmitted', (log: TransactionLog) => {
      this.broadcastLog(log);
    });
  }

  public handleSubscription(
    ws: WebSocket.WebSocket,
    request: SubscriptionRequest,
  ): void {
    const { method, params, id } = request;

    if (method !== 'eth_subscribe') {
      this.sendError(
        ws,
        id,
        -32601,
        'Method not found',
      );
      return;
    }

    if (!params || params.length === 0) {
      this.sendError(
        ws,
        id,
        -32602,
        'Invalid params: subscription type required',
      );
      return;
    }

    const subscriptionType = params[0];
    const filter = params[1] || {};

    const wsSubscriptionCount = Array.from(this.subscriptions.values()).filter(
      (sub) => sub.ws === ws,
    ).length;

    if (wsSubscriptionCount >= this.maxSubscriptionsPerConnection) {
      this.sendError(
        ws,
        id,
        -32603,
        `Maximum subscriptions (${this.maxSubscriptionsPerConnection}) reached for this connection`,
      );
      return;
    }

    const subscriptionId = uuidv4();

    switch (subscriptionType) {
      case 'newHeads':
        this.createNewHeadsSubscription(
          ws,
          subscriptionId,
          id,
          filter,
        );
        break;
      case 'logs':
        this.createLogsSubscription(
          ws,
          subscriptionId,
          id,
          filter,
        );
        break;
      case 'pendingTransactions':
        this.createPendingTransactionsSubscription(
          ws,
          subscriptionId,
          id,
          filter,
        );
        break;
      default:
        this.sendError(
          ws,
          id,
          -32602,
          `Unknown subscription type: ${subscriptionType}`,
        );
    }
  }

  private createNewHeadsSubscription(
    ws: WebSocket.WebSocket,
    subscriptionId: string,
    requestId: string | number,
    filter: Record<string, unknown>,
  ): void {
    const subscription: ActiveSubscription = {
      id: subscriptionId,
      type: 'newHeads',
      ws,
      filter,
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);

    this.sendResponse(
      ws,
      requestId,
      subscriptionId,
    );

    this.logger.info(`New subscription created: ${subscriptionId} (newHeads)`);

    const timeoutHandle = setTimeout(() => {
      this.removeSubscription(subscriptionId);
    }, this.subscriptionTimeout);

    ws.once('close', () => {
      clearTimeout(timeoutHandle);
      this.removeSubscription(subscriptionId);
    });
  }

  private createLogsSubscription(
    ws: WebSocket.WebSocket,
    subscriptionId: string,
    requestId: string | number,
    filter: Record<string, unknown>,
  ): void {
    const subscription: ActiveSubscription = {
      id: subscriptionId,
      type: 'logs',
      ws,
      filter,
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.sendResponse(
      ws,
      requestId,
      subscriptionId,
    );

    this.logger.info(
      `New subscription created: ${subscriptionId} (logs)`,
      { filter },
    );

    const timeoutHandle = setTimeout(() => {
      this.removeSubscription(subscriptionId);
    }, this.subscriptionTimeout);

    ws.once('close', () => {
      clearTimeout(timeoutHandle);
      this.removeSubscription(subscriptionId);
    });
  }

  private createPendingTransactionsSubscription(
    ws: WebSocket.WebSocket,
    subscriptionId: string,
    requestId: string | number,
    filter: Record<string, unknown>,
  ): void {
    const subscription: ActiveSubscription = {
      id: subscriptionId,
      type: 'pendingTransactions',
      ws,
      filter,
      createdAt: Date.now(),
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.sendResponse(
      ws,