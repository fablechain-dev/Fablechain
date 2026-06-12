import { createServer, Server, WebSocket } from 'ws';
import { newHeadsSubscription, logSubscription, pendingTransactionsSubscription } from './subscriptions';

const rpcServer: Server = createServer();

rpcServer.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket connection');

  ws.on('message', (message: string) => {
    const request = JSON.parse(message);
    switch (request.method) {
      case 'newHeads':
        newHeadsSubscription(ws, request);
        break;
      case 'logs':
        logSubscription(ws, request);
        break;
      case 'pendingTransactions':
        pendingTransactionsSubscription(ws, request);
        break;
      default:
        ws.send(JSON.stringify({ error: 'Unknown method' }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

rpcServer.listen(8080, () => {
  console.log('WebSocket RPC server listening on port 8080');
});