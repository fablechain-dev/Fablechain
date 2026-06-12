import { Block } from './Block';

export class Checkpoint {
  block: Block;
  interval: number;

  constructor(block: Block, interval: number) {
    this.block = block;
    this.interval = interval;
  }
}