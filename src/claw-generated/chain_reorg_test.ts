import { describe, it, expect } from 'vitest';
import { createTestChain, generateBlocks } from '../test-utils';

describe('Chain Reorganization', () => {
  it('should handle a short chain reorg', async () => {
    const { chain, miner } = await createTestChain();
    
    // Generate initial chain
    await generateBlocks(chain, 10);
    
    // Create a competing chain
    const { chain: competingChain, miner: competingMiner } = await createTestChain();
    await generateBlocks(competingChain, 5);
    
    // Trigger a reorg
    await competingMiner.mineBlock();
    await chain.sync(competingChain);
    
    // Verify chain state
    expect(chain.blocks.length).toBe(11);
    expect(chain.head.height).toBe(10);
  });
});