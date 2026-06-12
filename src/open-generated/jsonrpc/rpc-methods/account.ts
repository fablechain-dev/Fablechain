import { RPCRequest, RPCResponse } from '../rpc-types';
import { AccountManager } from '../../../blockchain/AccountManager';

export async function getAccountInfo(request: RPCRequest): Promise<RPCResponse> {
  const { address } = request.params;
  const accountManager = new AccountManager();
  const accountInfo = await accountManager.getAccountInfo(address);
  return { result: accountInfo };
}