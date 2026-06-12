import { Block } from './block';
import { Transaction } from './transaction';

describe('Block', () => {
  it('should create a new block', () => {
    const transactions: Transaction[] = [
      new Transaction(
        'sender',
        'recipient',
        100,
        'signature'
      )
    ];
    const block = new Block(1, Date.now(), transactions, 'prevHash');
    expect(block.version).toBe(1);
    expect(block.timestamp).toBeGreaterThan(0);
    expect(block.transactions).toEqual(transactions);
    expect(block.previousHash).toBe('prevHash');
    expect(block.hash).toBeTruthy();
  });

  it('should validate a block', () => {
    const transactions: Transaction[] = [
      new Transaction(
        'sender',
        'recipient',
        100,
        'signature'
      )
    ];
    const block = new Block(1, Date.now(), transactions, 'prevHash');
    expect(block.isValid()).toBe(true);
  });

  it('should serialize and deserialize a block', () => {
    const transactions: Transaction[] = [
      new Transaction(
        'sender',
        'recipient',
        100,
        'signature'
      )
    ];
    const block = new Block(1, Date.now(), transactions, 'prevHash');
    const serialized = block.serialize();
    const deserialized = JSON.parse(serialized);
    expect(deserialized.version).toBe(block.version);
    expect(deserialized.timestamp).toBe(block.timestamp);
    expect(deserialized.transactions).toEqual(block.transactions);
    expect(deserialized.previousHash).toBe(block.previousHash);
    expect(deserialized.hash).toBe(block.hash);
  });

  it('should calculate the correct hash', () => {
    const transactions: Transaction[] = [
      new Transaction(
        'sender',
        'recipient',
        100,
        'signature'
      )
    ];
    const block = new Block(1, Date.now(), transactions, 'prevHash');
    expect(block.calculateHash()).toBe(block.hash);
  });
});