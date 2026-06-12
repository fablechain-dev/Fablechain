// events.test.ts

import { EventEmitter, EventReceipt } from './events';
import { Transaction, TransactionReceipt } from './transaction';
import { Block, BlockReceipt } from './block';

describe('EventEmitter', () => {
  it('should emit and store events', () => {
    const emitter = new EventEmitter();
    emitter.emit('transfer', { from: '0x123', to: '0x456', amount: 100 });
    emitter.emit('approval', { owner: '0x123', spender: '0x456', amount: 50 });

    const events = emitter.getEvents();
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ name: 'transfer', data: { from: '0x123', to: '0x456', amount: 100 }});
    expect(events[1]).toEqual({ name: 'approval', data: { owner: '0x123', spender: '0x456', amount: 50 }});
  });
});

describe('EventReceipt', () => {
  it('should create a bloom filter for events', () => {
    const tx = new Transaction();
    tx.emit('transfer', { from: '0x123', to: '0x456', amount: 100 });
    tx.emit('approval', { owner: '0x123', spender: '0x456', amount: 50 });

    const receipt = tx.execute();
    const bloomFilter = receipt.getBloomFilter();

    expect(bloomFilter).toHaveLength(256);
    expect(bloomFilter).toContain(expect.any(Number));
  });
});

describe('BlockReceipt', () => {
  it('should aggregate bloom filters from transaction receipts', () => {
    const tx1 = new Transaction();
    tx1.emit('transfer', { from: '0x123', to: '0x456', amount: 100 });

    const tx2 = new Transaction();
    tx2.emit('approval', { owner: '0x123', spender: '0x456', amount: 50 });

    const block = new Block();
    block.addTransaction(tx1);
    block.addTransaction(tx2);
    const blockReceipt = block.mine();

    const bloomFilter = blockReceipt.getBloomFilter();
    expect(bloomFilter).toHaveLength(256);
    expect(bloomFilter).toContain(expect.any(Number));
  });
})