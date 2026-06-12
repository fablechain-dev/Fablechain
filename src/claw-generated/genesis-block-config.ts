export class GenesisBlockConfig {
  chainId: string;
  initialAllocations: { [address: string]: number };
  blockDifficulty: number;
  blockTime: number;

  constructor(
    chainId: string,
    initialAllocations: { [address: string]: number },
    blockDifficulty: number,
    blockTime: number
  ) {
    this.chainId = chainId;
    this.initialAllocations = initialAllocations;
    this.blockDifficulty = blockDifficulty;
    this.blockTime = blockTime;
  }
}