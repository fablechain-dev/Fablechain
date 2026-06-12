import { JsonRpcRequest, JsonRpcResponse, JsonRpcError } from './types';

class JsonRpcServer {
  private methods: { [key: string]: (...args: any[]) => Promise<any> } = {};

  registerMethod(name: string, handler: (...args: any[]) => Promise<any>) {
    this.methods[name] = handler;
  }

  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (Array.isArray(request)) {
      // Batch request
      const responses = await Promise.all(request.map(this.handleSingleRequest.bind(this)));
      return responses;
    } else {
      // Single request
      return this.handleSingleRequest(request);
    }
  }

  private async handleSingleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { id, method, params } = request;

    if (!this.methods[method]) {
      return {
        id,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      };
    }

    try {
      const result = await this.methods[method](...params);
      return { id, result };
    } catch (err) {
      let error: JsonRpcError;
      if (err instanceof Error) {
        error = {
          code: -32603,
          message: err.message,
        };
      } else {
        error = {
          code: -32000,
          message: 'Server error',
        };
      }
      return { id, error };
    }
  }
}

export default JsonRpcServer;