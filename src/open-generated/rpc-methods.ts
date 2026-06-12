// open-generated/rpc-methods.ts
import { RPCMethod } from './rpc-types';
import { getBalance } from './getBalance';

export const rpcMethods: Record<string, RPCMethod> = {
  'open_getBalance': async (params) => {
    const [address] = params;
    const balance = await getBalance(address);
    return balance;
  },
  'open_sendTransaction': async (params) => {
    const [transaction] = params;
    // TODO: Implement open_sendTransaction method
    return '0x1234567890abcdef';
  }
};