import { Block } from './Block';
import { GenesisBlockConfig, GenesisBlockConfigurator } from './GenesisBlockConfig';
import { GenesisBlockManager } from './GenesisBlockManager';
import { Chain } from './Chain';

export class BlockChain {
  private chain: Chain;
  private genesisBlockManager: GenesisBlockManager;

  constructor(genesisConfig: GenesisBlockConfig) {
    this.chain = new Chain();
    this.genesisBlockManager = new GenesisBlockManager(genesisConfig, this.chain);
  }

  async initialize(): Promise<void> {
    await this.genesisBlockManager.initializeGenesisBlock();
  }

  getChain(): Chain {
    return this.chain;
  }
}