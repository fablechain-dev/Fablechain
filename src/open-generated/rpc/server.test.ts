import JsonRpcServer from './server';
import { JsonRpcRequest, JsonRpcResponse } from './types';

describe('JsonRpcServer', () => {
  let server: JsonRpcServer;

  beforeEach(() => {
    server = new JsonRpcServer();
  });

  it('should handle single requests', async () => {
    server.registerMethod('add', (a: number, b: number) => Promise.resolve(a + b));

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: '1',
      method: 'add',
      params: [2, 3],
    };

    const response: JsonRpcResponse = await server.handleRequest(request);
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: '1',
      result: 5,
    });
  });

  it('should handle batch requests', async () => {
    server.registerMethod('add', (a: number, b: number) => Promise.resolve(a + b));
    server.registerMethod('subtract', (a: number, b: number) => Promise.resolve(a - b));

    const requests: JsonRpcRequest[] = [
      {
        jsonrpc: '2.0',
        id: '1',
        method: 'add',
        params: [2, 3],
      },
      {
        jsonrpc: '2.0',
        id: '2',
        method: 'subtract',
        params: [5, 3],
      },
    ];

    const responses: JsonRpcResponse[] = await server.handleRequest(requests);
    expect(responses).toEqual([
      {
        jsonrpc: '2.0',
        id: '1',
        result: 5,
      },
      {
        jsonrpc: '2.0',
        id: '2',
        result: 2,
      },
    ]);
  });

  it('should handle method not found error', async () => {
    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: '1',
      method: 'nonExistentMethod',
      params: [2, 3],
    };

    const response: JsonRpcResponse = await server.handleRequest(request);
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: '1',
      error: {
        code: -32601,
        message: 'Method not found',
      },
    });
  });

  it('should handle server error', async () => {
    server.registerMethod('throwError', () => Promise.reject(new Error('Something went wrong')));

    const request: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: '1',
      method: 'throwError',
      params: [],
    };

    const response: JsonRpcResponse = await server.handleRequest(request);
    expect(response).toEqual({
      jsonrpc: '2.0',
      id: '1',
      error: {
        code: -32603,
        message: 'Something went wrong',
      },
    });
  });
});