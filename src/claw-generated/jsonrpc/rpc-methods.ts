import { getAccountInfo } from './rpc-methods/account';
import { getBlock } from './rpc-methods/block';
import { RPCRequest, RPCResponse } from './rpc-types';

export const RPCMethods: Record&lt;string, (request: RPCRequest) =&gt; Promise&lt;RPCResponse&gt;&gt; = {
  'getAccountInfo': getAccountInfo,
  'getBlock': getBlock,
  // Add more RPC methods here
};