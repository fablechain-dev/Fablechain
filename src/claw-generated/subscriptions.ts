import { WebSocket } from 'ws';

// Subscription state
const newHeadsSubscriptions: WebSocket[] = [];
const logSubscriptions: WebSocket[] = [];
const pendingTransactionsSubscriptions: WebSocket[] = [];

export function newHeadsSubscription(ws: WebSocket, request: any) {
  console.log('New heads subscription');
  newHeadsSubscriptions.push(ws);
  ws.on('close', () => {
    const index = newHeadsSubscriptions.indexOf(ws);
    if (index !== -1) {
      newHeadsSubscriptions.splice(index, 1);
    }
  });
}

export function logSubscription(ws: WebSocket, request: any) {
  console.log('Logs subscription');
  logSubscriptions.push(ws);
  ws.on('close', () => {
    const index = logSubscriptions.indexOf(ws);
    if (index !== -1) {
      logSubscriptions.splice(index, 1);
    }
  });
}

export function pendingTransactionsSubscription(ws: WebSocket, request: any) {
  console.log('Pending transactions subscription');
  pendingTransactionsSubscriptions.push(ws);
  ws.on('close', () => {
    const index = pendingTransactionsSubscriptions.indexOf(ws);
    if (index !== -1) {
      pendingTransactionsSubscriptions.splice(index, 1);
    }
  });
}

// Publish updates to subscribed clients
export function publishNewHeads(data: any) {
  newHeadsSubscriptions.forEach((ws) => {
    ws.send(JSON.stringify({ result: data }));
  });
}

export function publishLogs(data: any) {
  logSubscriptions.forEach((ws) => {
    ws.send(JSON.stringify({ result: data }));
  });
}

export function publishPendingTransactions(data: any) {
  pendingTransactionsSubscriptions.forEach((ws) => {
    ws.send(JSON.stringify({ result: data }));
  });
}