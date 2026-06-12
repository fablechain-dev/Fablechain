import { Block } from '../blockchain/Block';
import { Transaction } from '../blockchain/Transaction';

describe('Block', () => {
  it('should create a new block', () => {
    const timestamp = Date.now();
    const transactions: Transaction[] = [
      new Transaction(1, 'sender', 'recipient', 100),
      new Transaction(2, 'sender2', 'recipient2', 50)
    ];
    const previousHash = 'abc123';
    const block = new Block(timestamp, transactions, previousHash);

    expect(block.timestamp).toEqual(timestamp);
    expect(block.transactions).toEqual(transactions);
    expect(block.previousHash).toEqual(previousHash);
    expect(block.hash).not.toBeEmpty();
  });

  it('should validate a block', () => {
    const timestamp = Date.now();
    const transactions: Transaction[] = [
      new Transaction(1, 'sender', 'recipient', 100),
      new Transaction(2, 'sender2', 'recipient2', 50)
    ];
    const previousHash = 'abc123';
    const block = new Block(timestamp, transactions, previousHash);

    expect(block.isValid()).toBeTrue();
  });

  it('should serialize and deserialize a block', () => {
    const timestamp = Date.now();
    const transactions: Transaction[] = [
      new Transaction(1, 'sender', 'recipient', 100),
      new Transaction(2, 'sender2', 'recipient2', 50)
    ];
    const previousHash = 'abc123';
    const block = new Block(timestamp, transactions, previousHash);

    const serialized = block.serialize();
    const deserialized = JSON.parse(serialized) as Block;

    expect(deserialized.timestamp).toEqual(block.timestamp);
    expect(deserialized.transactions).toEqual(block.transactions);
    expect(deserialized.previousHash).toEqual(block.previousHash);
    expect(deserialized.hash).toEqual(block.hash);
  });

  it('should calculate the correct hash', () => {
    const timestamp = Date.now();
    const transactions: Transaction[] = [
      new Transaction(1, 'sender', 'recipient', 100),
      new Transaction(2, 'sender2', 'recipient2', 50)
    ];
    const previousHash = 'abc123';
    const block = new Block(timestamp, transactions, previousHash);

    expect(block.hash).toEqual(block.calculateHash());
  });
});