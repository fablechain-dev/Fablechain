import { Block } from '../blockchain/block';
import { CompactBlock } from './compact_block';
import { Connection } from './connection';

export class Peer {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  sendBlock(block: Block) {
    const blockData = block.serialize();
    this.connection.send(blockData);
  }

  sendCompactBlock(compactBlock: CompactBlock) {
    const compactData = compactBlock.serialize();
    this.connection.send(compactData);
  }
}