import { RPCRequest, RPCResponse } from '../rpc-types';
import { BlockManager } from '../../../blockchain/BlockManager';

export async function getBlock(request: RPCRequest): Promise<RPCResponse> {
  const { blockHash } = request.params;
  const blockManager = new BlockManager();
  const block = await blockManager.getBlock(blockHash);
  return { result: block };
}