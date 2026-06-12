import { Block } from '../block';

describe('Block', () => {
  it('should validate block size within limit', () => {
    const block = new Block(
      1,
      1620000000,
      [{ tx: 'abc' }],
      '0x123',
      '0x456',
      1024 * 1024 // 1 MB block
    );
    expect(block.validate()).toBe(true);
  });

  it('should reject block size exceeding limit', () => {
    const block = new Block(
      1,
      1620000000,
      [{ tx: 'abc' }, { tx: 'def' }, { tx: 'ghi' }],
      '0x123',
      '0x456',
      3 * 1024 * 1024 // 3 MB block
    );
    expect(block.validate()).toBe(false);
  });

  it('should dynamically adjust block size limit', () => {
    // Create a series of blocks with increasing size
    const blocks = [];
    for (let i = 0; i < Block.BLOCK_SIZE_WINDOW; i++) {
      const block = new Block(
        i + 1,
        1620000000 + i,
        [{ tx: 'abc' }],
        '0x123',
        `0x${i.toString(16)}`,
        (i + 1) * 100 * 1024 // Increase block size by 100 KB each time
      );
      blocks.push(block);
    }

    // The last block should be valid due to the dynamic limit adjustment
    expect(blocks[blocks.length - 1].validate()).toBe(true);
  });
});