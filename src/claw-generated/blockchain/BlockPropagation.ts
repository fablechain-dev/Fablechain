import { Block } from './Block';
import { UncleBlock } from './UncleBlock';

export class BlockPropagation {
  async propagateBlock(block: Block): Promise<void> {
    // Existing logic to propagate a new main chain block
  }

  async propagateUncleBlock(block: UncleBlock): Promise<void> {
    // Propagate the uncle block to the network
    // This may involve different logic than for regular blocks, such as:
    // - Marking the block as an uncle
    // - Limiting the propagation radius or priority
    // - Notifying nodes that the block is an uncle
  }
}