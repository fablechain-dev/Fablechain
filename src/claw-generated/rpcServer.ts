import { getTransaction } from './getTransaction';

export class RPCServer {
  async handleRequest(method: string, params: any): Promise<any> {
    switch (method) {
      case 'getTransaction':
        return await getTransaction(params.signature);
      default:
        throw new Error(`Unknown RPC method: ${method}`);
    }
  }
}