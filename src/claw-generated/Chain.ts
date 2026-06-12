import { Block } from './Block';

export class Chain {
  blocks: Block[] = [];

  addBlock(data: any): void {
    const prevBlock = this.blocks[this.blocks.length - 1];
    const newBlock = new Block(prevBlock?.hash || '', data);
    this.blocks.push(newBlock);
  }

  isValid(): boolean {
    // Implement chain validation logic
    return true;
  }

  replaceChain(newChain: Block[]): boolean {
    if (newChain.length <= this.blocks.length) {
      return false;
    }

    if (!this.isValidChain(newChain)) {
      return false;
    }

    this.blocks = newChain;
    return true;
  }

  private isValidChain(chain: Block[]): boolean {
    // Implement chain validation logic
    return true;
  }
}