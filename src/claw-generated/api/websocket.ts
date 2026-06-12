import WebSocket from 'ws';
import { BlockManager } from '../blockchain/BlockManager';
import { TransactionPool } from '../TransactionPool';
import { TransactionReceipt } from '../TransactionReceipt';

class WebSocketServer {
  private wss: WebSocket.Server;
  private subscriptions: Map<WebSocket, Set<string>> = new Map();

  constructor(
    private blockManager: BlockManager,
    private transactionPool: TransactionPool
  ) {
    this.wss = new WebSocket.Server({ port: 8080 });
    this.initializeWebSocketServer();
  }

  private initializeWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      this.subscriptions.set(ws, new Set());

      ws.on('message', (message) => {
        this.handleWebSocketMessage(ws, message);
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.subscriptions.delete(ws);
      });
    });
  }

  private handleWebSocketMessage(ws: WebSocket, message: string) {
    try {
      const request = JSON.parse(message);
      switch (request.method) {
        case 'subscribe':
          this.handleSubscription(ws, request);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(ws, request);
          break;
        default:
          ws.send(JSON.stringify({ error: 'Invalid request method' }));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({ error: 'Invalid request' }));
    }
  }

  private handleSubscription(ws: WebSocket, request: any) {
    const { topic } = request;
    const subscriptions = this.subscriptions.get(ws) || new Set();

    switch (topic) {
      case 'newHeads':
        this.subscribeToNewHeads(ws);
        subscriptions.add('newHeads');
        break;
      case 'logs':
        this.subscribeToLogs(ws);
        subscriptions.add('logs');
        break;
      case 'pendingTransactions':
        this.subscribeToPendingTransactions(ws);
        subscriptions.add('pendingTransactions');
        break;
      default:
        ws.send(JSON.stringify({ error: 'Invalid subscription topic' }));
        return;
    }

    this.subscriptions.set(ws, subscriptions);
  }

  private handleUnsubscription(ws: WebSocket, request: any) {
    const { topic } = request;
    const subscriptions = this.subscriptions.get(ws) || new Set();

    switch (topic) {
      case 'newHeads':
        this.unsubscribeFromNewHeads(ws);
        subscriptions.delete('newHeads');
        break;
      case 'logs':
        this.unsubscribeFromLogs(ws);
        subscriptions.delete('logs');
        break;
      case 'pendingTransactions':
        this.unsubscribeFromPendingTransactions(ws);
        subscriptions.delete('pendingTransactions');
        break;
      default:
        ws.send(JSON.stringify({ error: 'Invalid unsubscription topic' }));
        return;
    }

    this.subscriptions.set(ws, subscriptions);
  }

  private subscribeToNewHeads(ws: WebSocket) {
    this.blockManager.on('newHead', (block) => {
      ws.send(JSON.stringify({ topic: 'newHeads', data: block }));
    });
  }

  private unsubscribeFromNewHeads(ws: WebSocket) {
    this.blockManager.off('newHead', (block) => {
      ws.send(JSON.stringify({ topic: 'newHeads', data: block }));
    });
  }

  private subscribeToLogs(ws: WebSocket) {
    this.transactionPool.on('transactionExecuted', (receipt: TransactionReceipt) => {
      ws.send(JSON.stringify({ topic: 'logs', data: receipt }));
    });
  }

  private unsubscribeFromLogs(ws: WebSocket) {
    this.transactionPool.off('transactionExecuted', (receipt: TransactionReceipt) => {
      ws.send(JSON.stringify({ topic: 'logs', data: receipt }));
    });
  }

  private subscribeToPendingTransactions(ws: WebSocket) {
    this.transactionPool.on('newTransaction', (transaction) => {
      ws.send(JSON.stringify({ topic: 'pendingTransactions', data: transaction }));
    });
  }

  private unsubscribeFromPendingTransactions(ws: WebSocket) {
    this.transactionPool.off('newTransaction', (transaction) => {
      ws.send(JSON.stringify({ topic: 'pendingTransactions', data: transaction }));
    });
  }
}

export default WebSocketServer;