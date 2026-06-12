import { RPCRequest, RPCResponse, RPCError } from './rpc-types';
import { RPCMethods } from './rpc-methods';

class RPCServer {
  async handleRequest(request: RPCRequest): Promise&lt;RPCResponse&gt; {
    const { method, params, id } = request;

    if (!RPCMethods[method]) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: 'Method not found'
        }
      };
    }

    try {
      const result = await RPCMethods[method](request);
      return {
        jsonrpc: '2.0',
        id,
        result
      };
    } catch (error) {
      let rpcError: RPCError;
      if (error instanceof Error) {
        rpcError = {
          code: -32603,
          message: error.message,
          data: error.stack
        };
      } else {
        rpcError = {
          code: -32603,
          message: 'Internal error',
          data: String(error)
        };
      }
      return {
        jsonrpc: '2.0',
        id,
        error: rpcError
      };
    }
  }

  async handleBatchRequest(requests: RPCRequest[]): Promise&lt;RPCResponse[]&gt; {
    return await Promise.all(requests.map(this.handleRequest.bind(this)));
  }

  async handleWebSocketRequest(data: any): Promise&lt;void&gt; {
    let request: RPCRequest;
    try {
      request = JSON.parse(data);
    } catch (error) {
      this.sendErrorResponse({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error'
        }
      });
      return;
    }

    let response: RPCResponse;
    if (Array.isArray(request)) {
      response = await this.handleBatchRequest(request);
    } else {
      response = await this.handleRequest(request);
    }

    this.sendResponse(response);
  }

  sendResponse(response: RPCResponse): void {
    // Send the response back to the client
  }

  sendErrorResponse(error: RPCResponse): void {
    // Send the error response back to the client
  }
}

export default RPCServer;