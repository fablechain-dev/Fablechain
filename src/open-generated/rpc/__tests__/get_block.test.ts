import { GetBlockRpcImpl } from '../get_block';
import { BlockManager } from '../../BlockManager';
import { Block } from '../../Block';
import { Transaction } from '../../Transaction';

jest.mock('../../BlockManager');

describe('GetBlockRpcImpl', () => {
  let blockManager: jest.Mocked<BlockManager>;
  let getBlockRpc: GetBlockRpcImpl;

  beforeEach(() => {
    blockManager = new BlockManager as jest.Mocked<BlockManager>;
    getBlockRpc = new GetBlockRpcImpl(blockManager);
  });

  it('should return block details', async () => {
    const mockBlock = new Block({
      slot: 123,
      timestamp: 1234567890,
      transactions: [
        new Transaction({ signature: 'tx1' }),
        new Transaction({ signature: 'tx2' }),
      ],
    });
    blockManager.get_block_by_slot.mockResolvedValue(mockBlock);

    const result = await getBlockRpc.get_block(123);

    expect(result).toEqual({
      slot: 123,
      timestamp: 1234567890,
      transactions: [
        { signature: 'tx1' },
        { signature: 'tx2' },
      ],
    });
    expect(blockManager.get_block_by_slot).toHaveBeenCalledWith(123);
  });

  it('should handle errors', async () => {
    blockManager.get_block_by_slot.mockRejectedValue(new Error('Failed to fetch block'));

    await expect(getBlockRpc.get_block(123)).rejects.toThrowError('Failed to fetch block');
  });
});