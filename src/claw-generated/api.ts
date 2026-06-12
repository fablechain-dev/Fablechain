import { Blockchain } from './blockchain';

export class API {
  private blockchain: Blockchain;

  constructor(blockchain: Blockchain) {
    this.blockchain = blockchain;
  }

  getBlockFinality(blockHash: string): { finalized: boolean, confirmations: number } {
    const block = this.blockchain.getChain().find(b => b.hash === blockHash);
    if (!block) {
      return { finalized: false, confirmations: 0 };
    }
    const confirmations = this.blockchain.getChain().filter(b => b.hash === blockHash).length;
    return { finalized: block.finalized, confirmations };
  }
}