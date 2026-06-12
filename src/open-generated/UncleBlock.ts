import { Block } from './Block';

export class UncleBlock extends Block {
  uncleIndex: number;
  blockNumber: number;

  constructor(prevHash: string, data: any, uncleIndex: number, blockNumber: number) {
    super(prevHash, data);
    this.uncleIndex = uncleIndex;
    this.blockNumber = blockNumber;
  }

  computeHash(): string {
    // Implement hash computation logic for uncle blocks
    return `uncle-${this.uncleIndex}-${this.hash}`;
  }
}