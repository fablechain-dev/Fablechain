import { BlockchainManager } from './BlockchainManager';

export class BlockchainController {
  private readonly blockchainManager: BlockchainManager = new BlockchainManager();

  public getBlockFinalizationStatus(blockId: string): {
    finalized: boolean;
    confirmations: number;
  } {
    return this.blockchainManager.getFinalizationStatus(blockId);
  }

  public addBlock(block: any): void {
    const newBlock = new Block(
      block.id,
      block.timestamp,
      block.transactions,
      block.previousHash,
      block.hash
    );
    this.blockchainManager.addBlock(newBlock);
  }
}