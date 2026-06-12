export class GenesisConfig {
  chainId: string;
  initialAccounts: { [address: string]: number };
  initialContracts: { [address: string]: string };
  blockTimestamp: number;
  blockDifficulty: number;

  constructor(config: {
    chainId: string;
    initialAccounts: { [address: string]: number };
    initialContracts: { [address: string]: string };
    blockTimestamp: number;
    blockDifficulty: number;
  }) {
    this.chainId = config.chainId;
    this.initialAccounts = config.initialAccounts;
    this.initialContracts = config.initialContracts;
    this.blockTimestamp = config.blockTimestamp;
    this.blockDifficulty = config.blockDifficulty;
  }
}