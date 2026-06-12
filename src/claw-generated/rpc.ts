import { JsonRpcServer } from './jsonrpc/server';

const rpcServer = new JsonRpcServer();

rpcServer.registerMethod('simulateTransaction', async (params) => {
  // Implement simulateTransaction logic here
  return { success: true };
});

rpcServer.registerMethod('getBalance', async (params) => {
  // Implement getBalance logic here
  return { balance: 100 };
});

export async function handleRpcRequest(request: any): Promise<any> {
  return rpcServer.handleRequest(request);
}