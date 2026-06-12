import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { parseJsonRpcRequest, JsonRpcRequest, JsonRpcResponse } from './rpc-methods';

class JsonRpcServer {
  private server: ReturnType<typeof createServer>;
  private rpcMethods: Record<string, (params: any) => Promise<any>>;

  constructor(rpcMethods: Record<string, (params: any) => Promise<any>>) {
    this.rpcMethods = rpcMethods;
    this.server = createServer(this.handleRequest.bind(this));
  }

  start(port: number) {
    this.server.listen(port, () => {
      console.log(`JSON-RPC server listening on port ${port}`);
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse) {
    if (req.method === 'POST' && req.url === '/rpc') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const request = parseJsonRpcRequest(body);
          const response = await this.handleJsonRpcRequest(request);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(response));
        } catch (error) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: { code: -32700, message: 'Parse error' } }));
        }
      });
    } else {
      res.statusCode = 404;
      res.end();
    }
  }

  private async handleJsonRpcRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (Array.isArray(request)) {
      // Handle batch requests
      const responses = await Promise.all(request.map(async (req) => this.handleSingleRequest(req)));
      return responses;
    } else {
      return this.handleSingleRequest(request);
    }
  }

  private async handleSingleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { method, params, id } = request;
    if (typeof this.rpcMethods[method] !== 'function') {
      return { id, error: { code: -32601, message: 'Method not found' } };
    }

    try {
      const result = await this.rpcMethods[method](params);
      return { id, result };
    } catch (error) {
      return { id, error: { code: -32603, message: 'Internal error' } };
    }
  }
}

export default JsonRpcServer;