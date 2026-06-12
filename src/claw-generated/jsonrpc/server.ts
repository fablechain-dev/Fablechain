import { isArray, isObject } from 'lodash';

export class JsonRpcServer {
  private methods: Record<string, (...args: any[]) => Promise<any>> = {};

  registerMethod(name: string, handler: (...args: any[]) => Promise<any>) {
    this.methods[name] = handler;
  }

  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (isArray(request)) {
      // Handle batch request
      const responses = await Promise.all(request.map(this.handleSingleRequest.bind(this)));
      return responses;
    } else {
      return this.handleSingleRequest(request);
    }
  }

  private async handleSingleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { id, method, params } = request;

    if (!method) {
      return this.createErrorResponse(id, -32600, 'Invalid Request');
    }

    const handler = this.methods[method];
    if (!handler) {
      return this.createErrorResponse(id, -32601, 'Method not found');
    }

    try {
      const result = await handler(params);
      return this.createSuccessResponse(id, result);
    } catch (error) {
      const code = (error as any).code || -32000;
      const message = (error as any).message || 'Internal error';
      return this.createErrorResponse(id, code, message);
    }
  }

  private createSuccessResponse(id: string | number | null, result: any): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }

  private createErrorResponse(id: string | number | null, code: number, message: string): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
      },
    };
  }
}

type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: any;
} | Array<JsonRpcRequest>;

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
};