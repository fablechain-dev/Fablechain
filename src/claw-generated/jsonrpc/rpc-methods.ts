import { JsonRpcServer } from './server';
import { getAccountInfo, getBalance, getSignaturesForAddress, getTransaction, getTransactionReceipt } from './rpc-methods/account';
import { getBlock } from './rpc-methods/block';
import { simulateTransaction } from './rpc-methods/transaction';
import { getNetworkStats } from './rpc-methods/network-stats';

export function registerRpcMethods(rpcServer: JsonRpcServer) {
  rpcServer.registerMethod('getAccountInfo', getAccountInfo);
  rpcServer.registerMethod('getBalance', getBalance);
  rpcServer.registerMethod('getSignaturesForAddress', getSignaturesForAddress);
  rpcServer.registerMethod('getTransaction', getTransaction);
  rpcServer.registerMethod('getTransactionReceipt', getTransactionReceipt);
  rpcServer.registerMethod('getBlock', getBlock);
  rpcServer.registerMethod('simulateTransaction', simulateTransaction);
  rpcServer.registerMethod('getNetworkStats', getNetworkStats);
}