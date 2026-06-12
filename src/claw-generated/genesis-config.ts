import { GenesisBuilder } from './genesis';
import path from 'path';

export class GenesisConfig {
  private genesisBlock: Block;

  constructor() {
    const builder = new GenesisBuilder();
    builder.loadAccountsFromFile('../../fixtures/genesis-accounts.json');
    builder.setChainConfig({
      chainId: 'clawchain',
      blockTime: 10,
      gasLimit: 8000000,
      initialSupply: 1000000000
    });
    this.genesisBlock = builder.build();
  }

  getGenesisBlock(): Block {
    return this.genesisBlock;
  }
}