import WebSocket from 'ws';
import { RpcServer } from './rpc-server';
import { EventEmitter } from 'events';
import { Block, Transaction } from '../core/types';

class WebSocketServer {
  private wss: WebSocket.Server;
  private rpcServer: RpcServer;
  private eventEmitter: EventEmitter;
  private subscriptions: Map<WebSocket, Set<string>> = new Map();

  constructor(rpcServer: RpcServer, eventEmitter: EventEmitter) {
    this.rpcServer = rpcServer;
    this.eventEmitter = eventEmitter;
    this.wss = new WebSocket.Server({ port: 8080 });

    this.wss.on('connection', (ws) => {
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
          this.sendErrorResponse(ws, `Unknown method: ${request.method}`);
      }
    } catch (err) {
      this.sendErrorResponse(ws, err.message);
    }
  }

  private handleSubscription(ws: WebSocket, request: any) {
    const { method, params } = request;
    switch (method) {
      case 'subscribe':
        switch (params.type) {
          case 'newHeads':
            this.subscribeToNewHeads(ws);
            break;
          case 'logs':
            this.subscribeToLogs(ws, params.filter);
            break;
          case 'pendingTransactions':
            this.subscribeToPendingTransactions(ws);
            break;
          default:
            this.sendErrorResponse(ws, `Unknown subscription type: ${params.type}`);
        }
        break;
      default:
        this.sendErrorResponse(ws, `Unknown method: ${method}`);
    }
  }

  private handleUnsubscription(ws: WebSocket, request: any) {
    const { method, params } = request;
    switch (method) {
      case 'unsubscribe':
        switch (params.type) {
          case 'newHeads':
            this.unsubscribeFromNewHeads(ws);
            break;
          case 'logs':
            this.unsubscribeFromLogs(ws, params.filter);
            break;
          case 'pendingTransactions':
            this.unsubscribeFromPendingTransactions(ws);
            break;
          default:
            this.sendErrorResponse(ws, `Unknown subscription type: ${params.type}`);
        }
        break;
      default:
        this.sendErrorResponse(ws, `Unknown method: ${method}`);
    }
  }

  private subscribeToNewHeads(ws: WebSocket) {
    this.subscriptions.get(ws)?.add('newHeads');
    this.eventEmitter.on('newBlock', (block: Block) => {
      this.sendUpdate(ws, 'newHeads', block);
    });
  }

  private unsubscribeFromNewHeads(ws: WebSocket) {
    this.subscriptions.get(ws)?.delete('newHeads');
    this.eventEmitter.off('newBlock', this.sendUpdate);
  }

  private subscribeToLogs(ws: WebSocket, filter: any) {
    this.subscriptions.get(ws)?.add(`logs:${JSON.stringify(filter)}`);
    this.eventEmitter.on('log', (log: any) => {
      if (this.matchesFilter(log, filter)) {
        this.sendUpdate(ws, 'logs', log);
      }
    });
  }

  private unsubscribeFromLogs(ws: WebSocket, filter: any) {
    this.subscriptions.get(ws)?.delete(`logs:${JSON.stringify(filter)}`);
    this.eventEmitter.off('log', this.sendUpdate);
  }

  private subscribeToPendingTransactions(ws: WebSocket) {
    this.subscriptions.get(ws)?.add('pendingTransactions');
    this.eventEmitter.on('pendingTransaction', (tx: Transaction) => {
      this.sendUpdate(ws, 'pendingTransactions', tx);
    });
  }

  private unsubscribeFromPendingTransactions(ws: WebSocket) {
    this.subscriptions.get(ws)?.delete('pendingTransactions');
    this.eventEmitter.off('pendingTransaction', this.sendUpdate);
  }

  private sendUpdate(ws: WebSocket, type: string, data: any) {
    ws.send(JSON.stringify({ type, data }));
  }

  private sendErrorResponse(ws: WebSocket, errorMessage: string) {
    ws.send(JSON.stringify({ error: errorMessage }));
  }

  private matchesFilter(log: any, filter: any): boolean {
    // Implement log filtering logic
    return true;
  }

  start() {
    this.wss.start();
  }
}

export { WebSocketServer };