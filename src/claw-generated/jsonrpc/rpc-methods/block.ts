import { getBlock as getBlockImpl } from '../../rpc/block';

export async function getBlock(params: { slot: number }): Promise<any> {
  const { slot } = params;
  return await getBlockImpl(slot);
}