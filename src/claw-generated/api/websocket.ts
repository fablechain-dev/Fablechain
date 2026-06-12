import WebSocket from 'ws';
import { BlockManager } from '../blockchain/BlockManager';
import { TransactionPool } from '../TransactionPool';
import { TransactionReceipt } from '../TransactionReceipt';

class WebSocketServer {
  private wss: WebSocket.Server;

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

      ws.on('message', (message) => {
        this.handleWebSocketMessage(ws, message);
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
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
    switch (topic) {
      case 'newHeads':
        this.subscribeToNewHeads(ws);
        break;
      case 'logs':
        this.subscribeToLogs(ws);
        break;
      case 'pendingTransactions':
        this.subscribeToPendingTransactions(ws);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Invalid subscription topic' }));
    }
  }

  private handleUnsubscription(ws: WebSocket, request: any) {
    const { topic } = request;
    switch (topic) {
      case 'newHeads':
        this.unsubscribeFromNewHeads(ws);
        break;
      case 'logs':
        this.unsubscribeFromLogs(ws);
        break;
      case 'pendingTransactions':
        this.unsubscribeFromPendingTransactions(ws);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Invalid unsubscription topic' }));
    }
  }

  private subscribeToNewHeads(ws: WebSocket) {
    this.blockManager.on('newHead', (block) => {
      ws.send(JSON.stringify({ topic: 'newHeads', data: block }));
    });
  }

  private unsubscribeFromNewHeads(ws: WebSocket) {
    this.blockManager.off('newHead');
  }

  private subscribeToLogs(ws: WebSocket) {
    this.transactionPool.on('transactionExecuted', (receipt: TransactionReceipt) => {
      ws.send(JSON.stringify({ topic: 'logs', data: receipt }));
    });
  }

  private unsubscribeFromLogs(ws: WebSocket) {
    this.transactionPool.off('transactionExecuted');
  }

  private subscribeToPendingTransactions(ws: WebSocket) {
    this.transactionPool.on('newTransaction', (transaction) => {
      ws.send(JSON.stringify({ topic: 'pendingTransactions', data: transaction }));
    });
  }

  private unsubscribeFromPendingTransactions(ws: WebSocket) {
    this.transactionPool.off('newTransaction');
  }
}

export default WebSocketServer;