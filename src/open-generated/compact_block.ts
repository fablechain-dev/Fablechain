import { Block } from '../blockchain/block';

export class CompactBlock {
  private blockHeader: Buffer;
  private transactions: Buffer[];

  constructor(block: Block) {
    this.blockHeader = block.header.serialize();
    this.transactions = block.transactions.map(tx => tx.serialize());
  }

  serialize(): Buffer {
    // TODO: Implement compact serialization
    return Buffer.concat([this.blockHeader, ...this.transactions]);
  }

  deserialize(data: Buffer): Block {
    // TODO: Implement compact deserialization
    const header = Block.deserializeHeader(data.slice(0, 80));
    const txCount = data.readUInt32BE(80);
    const transactions = [];
    let offset = 84;
    for (let i = 0; i < txCount; i++) {
      const txLen = data.readUInt32BE(offset);
      transactions.push(Transaction.deserialize(data.slice(offset, offset + txLen)));
      offset += txLen + 4;
    }
    return new Block(header, transactions);
  }
}