import WebSocket from 'ws';
import { BlockManager } from '../blockchain/BlockManager';
import { TransactionPool } from '../TransactionPool';
import WebSocketServer from './websocket';

class RPCServer {
  private webSocketServer: WebSocketServer;

  constructor(
    private blockManager: BlockManager,
    private transactionPool: TransactionPool
  ) {
    this.webSocketServer = new WebSocketServer(blockManager, transactionPool);
  }

  start() {
    // Start the RPC server
    // ...

    // Start the WebSocket server
    this.webSocketServer.start();
  }
}

export default RPCServer;