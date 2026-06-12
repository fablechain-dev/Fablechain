import { GenesisConfig } from './GenesisConfig';

export class Blockchain {
  private blocks: Block[] = [];
  private accounts: { [address: string]: Account } = {};
  private contracts: { [address: string]: Contract } = {};

  constructor(genesisConfig: GenesisConfig) {
    this.initializeGenesisBlock(genesisConfig);
  }

  private initializeGenesisBlock(config: GenesisConfig) {
    // Create the genesis block
    const genesisBlock = new Block({
      timestamp: config.blockTimestamp,
      difficulty: config.blockDifficulty,
      transactions: [],
      parentHash: '0x0'
    });

    // Initialize accounts from genesis config
    for (const [address, balance] of Object.entries(config.initialAccounts)) {
      this.accounts[address] = new Account(address, balance);
    }

    // Initialize contracts from genesis config
    for (const [address, code] of Object.entries(config.initialContracts)) {
      this.contracts[address] = new Contract(address, code);
    }

    // Add the genesis block to the chain
    this.blocks.push(genesisBlock);
  }

  // Add other blockchain methods here
}

class Block {
  // Block properties and methods
}

class Account {
  // Account properties and methods  
}

class Contract {
  // Contract properties and methods
}