import { Block } from './Block';
import { Transaction } from './Transaction';

describe('Block', () => {
  it('should create a new block', () => {
    const transactions: Transaction[] = [
      { id: '1', from: 'Alice', to: 'Bob', amount: 10 },
      { id: '2', from: 'Bob', to: 'Charlie', amount: 5 },
    ];
    const block = new Block(1, Date.now(), transactions, 'prevHash');

    expect(block.number).toBe(1);
    expect(block.timestamp).toBeGreaterThan(0);
    expect(block.transactions).toEqual(transactions);
    expect(block.previousHash).toBe('prevHash');
    expect(block.hash).not.toBeEmpty();
  });

  it('should validate a block', () => {
    const transactions: Transaction[] = [
      { id: '1', from: 'Alice', to: 'Bob', amount: 10 },
      { id: '2', from: 'Bob', to: 'Charlie', amount: 5 },
    ];
    const block = new Block(1, Date.now(), transactions, 'prevHash');

    expect(block.isValid()).toBe(true);
  });

  it('should serialize and deserialize a block', () => {
    const transactions: Transaction[] = [
      { id: '1', from: 'Alice', to: 'Bob', amount: 10 },
      { id: '2', from: 'Bob', to: 'Charlie', amount: 5 },
    ];
    const block = new Block(1, Date.now(), transactions, 'prevHash');
    const serialized = block.serialize();
    const deserialized = JSON.parse(serialized) as Block;

    expect(deserialized.number).toBe(block.number);
    expect(deserialized.timestamp).toBe(block.timestamp);
    expect(deserialized.transactions).toEqual(block.transactions);
    expect(deserialized.previousHash).toBe(block.previousHash);
    expect(deserialized.hash).toBe(block.hash);
  });

  it('should calculate the correct hash', () => {
    const transactions: Transaction[] = [
      { id: '1', from: 'Alice', to: 'Bob', amount: 10 },
      { id: '2', from: 'Bob', to: 'Charlie', amount: 5 },
    ];
    const block = new Block(1, Date.now(), transactions, 'prevHash');
    const expectedHash = '0123456789abcdef'; // Replace with actual hash calculation

    expect(block.hash).toBe(expectedHash);
  });
});