import WebSocket from 'ws';
import { WebSocketServer } from '../websocket';
import { RpcServer } from '../rpc-server';
import { EventEmitter } from 'events';
import { Block, Transaction } from '../../core/types';

describe('WebSocketServer', () => {
  let webSocketServer: WebSocketServer;
  let rpcServer: RpcServer;
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    rpcServer = new RpcServer(null, null);
    webSocketServer = new WebSocketServer(rpcServer, eventEmitter);
  });

  test('subscribes and unsubscribes to newHeads', (done) => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.on('open', () => {
      ws.send(JSON.stringify({ method: 'subscribe', params: { type: 'newHeads' } }));
      eventEmitter.emit('newBlock', { number: 1 } as Block);
      ws.on('message', (message) => {
        const { type, data } = JSON.parse(message);
        expect(type).toBe('newHeads');
        expect(data).toEqual({ number: 1 });
        ws.send(JSON.stringify({ method: 'unsubscribe', params: { type: 'newHeads' } }));
        eventEmitter.emit('newBlock', { number: 2 } as Block);
        setTimeout(() => {
          done();
        }, 100);
      });
    });
  });

  test('subscribes and unsubscribes to logs', (done) => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.on('open', () => {
      ws.send(JSON.stringify({ method: 'subscribe', params: { type: 'logs', filter: { address: '0x123' } } }));
      eventEmitter.emit('log', { address: '0x123', data: '0x456' });
      eventEmitter.emit('log', { address: '0x456', data: '0x789' });
      ws.on('message', (message) => {
        const { type, data } = JSON.parse(message);
        expect(type).toBe('logs');
        expect(data).toEqual({ address: '0x123', data: '0x456' });
        ws.send(JSON.stringify({ method: 'unsubscribe', params: { type: 'logs', filter: { address: '0x123' } } }));
        eventEmitter.emit('log', { address: '0x123', data: '0x456' });
        eventEmitter.emit('log', { address: '0x456', data: '0x789' });
        setTimeout(() => {
          done();
        }, 100);
      });
    });
  });

  test('subscribes and unsubscribes to pendingTransactions', (done) => {
    const ws = new WebSocket('ws://localhost:8080');
    ws.on('open', () => {
      ws.send(JSON.stringify({ method: 'subscribe', params: { type: 'pendingTransactions' } }));
      eventEmitter.emit('pendingTransaction', { from: '0x123', to: '0x456', value: 100 } as Transaction);
      ws.on('message', (message) => {
        const { type, data } = JSON.parse(message);
        expect(type).toBe('pendingTransactions');
        expect(data).toEqual({ from: '0x123', to: '0x456', value: 100 });
        ws.send(JSON.stringify({ method: 'unsubscribe', params: { type: 'pendingTransactions' } }));
        eventEmitter.emit('pendingTransaction', { from: '0x456', to: '0x789', value: 200 } as Transaction);
        setTimeout(() => {
          done();
        }, 100);
      });
    });
  });
});