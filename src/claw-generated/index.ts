import { JsonRpcServer } from './rpc';

const rpcServer = new JsonRpcServer();

// Example usage
const exampleRequest = '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x1234567890abcdef"],"id":1}';
rpcServer.handleRequest(exampleRequest)
  .then((response) => {
    console.log(response);
  })
  .catch((err) => {
    console.error('RPC error:', err);
  });