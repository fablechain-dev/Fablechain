import { Block } from './Block';
import { Chain } from './Chain';

class BlockFinality {
  private chain: Chain;
  private requiredConfirmations: number;

  constructor(chain: Chain, requiredConfirmations: number) {
    this.chain = chain;
    this.requiredConfirmations = requiredConfirmations;
  }

  async addBlock(block: Block): Promise<void> {
    this.chain.addBlock(block);
    this.checkFinality(block);
  }

  private checkFinality(block: Block): void {
    const { finalized, confirmations } = this.chain.getFinalizationStatus(block.index);
    if (!finalized && confirmations >= this.requiredConfirmations) {
      this.finalizeBlock(block);
    }
  }

  private finalizeBlock(block: Block): void {
    block.finalize();
    this.chain.finalizeBlock(block);
  }

  getFinalizationStatus(blockIndex: number): {
    finalized: boolean;
    confirmations: number;
  } {
    return this.chain.getFinalizationStatus(blockIndex);
  }
}

export { BlockFinality };