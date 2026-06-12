import { TransactionGossipProtocol } from './transaction_gossip_protocol';
import { Transaction } from '../core/transaction';
import { Peer } from './peer';
import { MempoolManager } from '../mempool/mempool_manager';

describe('TransactionGossipProtocol', () => {
  let protocol: TransactionGossipProtocol;
  let mempoolManager: MempoolManager;
  let peer1: Peer;
  let peer2: Peer;

  beforeEach(() => {
    mempoolManager = new MempoolManager();
    protocol = new TransactionGossipProtocol(mempoolManager);
    peer1 = new Peer('peer1');
    peer2 = new Peer('peer2');
  });

  it('should add transaction to mempool and broadcast to peers', () => {
    const tx = new Transaction({
      from: '0x123',
      to: '0x456',
      value: 100,
      nonce: 0,
    });

    protocol.handleNewTransaction(tx, peer1);

    expect(mempoolManager.getTransactions().length).toBe(1);
    expect(peer1.sentTransactions.length).toBe(0);
    expect(peer2.sentTransactions.length).toBe(1);
    expect(peer2.sentTransactions[0].hash()).toEqual(tx.hash());
  });

  it('should not broadcast the same transaction twice', () => {
    const tx = new Transaction({
      from: '0x123',
      to: '0x456',
      value: 100,
      nonce: 0,
    });

    protocol.handleNewTransaction(tx, peer1);
    protocol.handleNewTransaction(tx, peer2);

    expect(mempoolManager.getTransactions().length).toBe(1);
    expect(peer1.sentTransactions.length).toBe(0);
    expect(peer2.sentTransactions.length).toBe(1);
  });
});