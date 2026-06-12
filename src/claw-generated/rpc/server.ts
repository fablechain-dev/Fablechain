import { parse, Response, JsonRpcError } from 'jsonrpc-lite';
import { getBalance, sendTransaction, getTransaction } from '../blockchain';

export class JsonRpcServer {
  async handleRequest(rawRequest: string): Promise<string> {
    const request = parse(rawRequest);

    if (request.isNotification()) {
      // Handle notification
      return '';
    } else if (request.isBatch()) {
      // Handle batch request
      const responses = await Promise.all(request.map(async (req) => {
        return this.handleSingleRequest(req);
      }));
      return JSON.stringify(responses);
    } else {
      // Handle single request
      return this.handleSingleRequest(request);
    }
  }

  private async handleSingleRequest(request: any): Promise<Response> {
    try {
      switch (request.method) {
        case 'eth_getBalance':
          const balance = await getBalance(request.params[0]);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: balance.toString()
          };
        case 'eth_sendTransaction':
          const txHash = await sendTransaction(request.params[0]);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: txHash
          };
        case 'eth_getTransaction':
          const transaction = await getTransaction(request.params[0]);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: transaction || null
          };
        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: 'Method not found'
            }
          };
      }
    } catch (err) {
      console.error('RPC error:', err);
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: 'Internal error'
        }
      };
    }
  }
}