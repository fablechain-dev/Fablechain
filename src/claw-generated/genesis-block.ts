import { Block } from './block';
import { GenesisBlockConfig } from './genesis-block-config';

export class GenesisBlock extends Block {
  constructor(config: GenesisBlockConfig) {
    super(
      0, // block number
      0, // timestamp
      [], // transactions
      config.blockDifficulty,
      config.chainId
    );

    // Set initial token allocations
    for (const [address, balance] of Object.entries(config.initialAllocations)) {
      this.addAccount(address, balance);
    }
  }
}