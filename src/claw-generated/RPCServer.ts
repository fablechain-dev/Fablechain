import { Chain } from './Chain';

export class RPCServer {
  private chain: Chain;

  constructor(chain: Chain) {
    this.chain = chain;
  }

  public getBlockFinalizationStatus(blockIndex: number): {
    finalized: boolean;
    confirmations: number;
  } {
    return this.chain.getFinalizationStatus(blockIndex);
  }
}