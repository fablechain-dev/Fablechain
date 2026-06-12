import { Block } from './Block';

export class BlockchainManager {
  private readonly chain: Block[] = [];
  private readonly requiredConfirmations: number = 6;

  public addBlock(block: Block): void {
    this.chain.push(block);
    this.updateFinality();
  }

  private updateFinality(): void {
    for (let i = this.chain.length - 1; i >= 0; i--) {
      const block = this.chain[i];
      block.incrementConfirmations();
    }
  }

  public getFinalizationStatus(blockId: string): {
    finalized: boolean;
    confirmations: number;
  } {
    const block = this.chain.find((b) => b.id === blockId);
    if (!block) {
      return {
        finalized: false,
        confirmations: 0,
      };
    }

    return {
      finalized: block.isFinalized(this.requiredConfirmations),
      confirmations: block.confirmations,
    };
  }
}