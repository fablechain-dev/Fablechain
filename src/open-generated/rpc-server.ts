import { JsonRpcServer } from './json-rpc-server';

export class RPCServer extends JsonRpcServer {
  constructor() {
    super();
    this.registerMethods();
  }

  registerMethods() {
    this.addMethod('sendTransaction', this.sendTransaction.bind(this));
  }

  async sendTransaction(params: any): Promise<any> {
    // TODO: Implement sendTransaction RPC
    return {
      result: 'Transaction sent successfully'
    };
  }
}