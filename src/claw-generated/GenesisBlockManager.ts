import { GenesisBlockConfig, GenesisBlockConfigurator } from './GenesisBlockConfig';
import { Block } from './Block';
import { Account } from './Account';
import { Chain } from './Chain';

export class GenesisBlockManager {
  private config: GenesisBlockConfig;
  private chain: Chain;

  constructor(config: GenesisBlockConfig, chain: Chain) {
    this.config = config;
    this.chain = chain;
  }

  async initializeGenesisBlock(): Promise<void> {
    const configurator = new GenesisBlockConfigurator(this.config);
    const initialAccounts = configurator.getInitialAccounts();
    const initialParameters = configurator.getInitialParameters();

    const genesisBlock = await Block.createGenesisBlock(
      initialAccounts,
      initialParameters.blockTime,
      initialParameters.blockReward,
      initialParameters.maxBlockSize
    );

    this.chain.addBlock(genesisBlock);
  }
}