import { StateChannel } from '../StateChannel';
import { Wallet } from '../../core/Wallet';
import { Transaction } from '../../core/Transaction';

describe('StateChannel', () => {
  let wallet1: Wallet;
  let wallet2: Wallet;
  let channel: StateChannel;

  beforeEach(() => {
    wallet1 = new Wallet();
    wallet2 = new Wallet();
    channel = new StateChannel([wallet1, wallet2]);
  });

  it('should open and close a channel', () => {
    expect(channel.isOpen).toBe(false);
    channel.open();
    expect(channel.isOpen).toBe(true);
    channel.close();
    expect(channel.isOpen).toBe(false);
  });

  it('should add transactions to the channel', () => {
    channel.open();
    const tx1 = new Transaction({ from: wallet1, to: wallet2, amount: 10 });
    const tx2 = new Transaction({ from: wallet2, to: wallet1, amount: 5 });
    channel.addTransaction(tx1);
    channel.addTransaction(tx2);
    expect(channel.getState()).toEqual([tx1, tx2]);
  });

  it('should not allow adding transactions to a closed channel', () => {
    expect(() => channel.addTransaction(new Transaction({ from: wallet1, to: wallet2, amount: 10 }))).toThrow('Channel is closed');
  });
});