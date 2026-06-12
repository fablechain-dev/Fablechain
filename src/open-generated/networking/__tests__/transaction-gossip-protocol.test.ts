import { TransactionGossipProtocol } from '../transaction-gossip-protocol';
import { TransactionMempool } from '../../transaction_mempool';
import { Peer } from '../peer_connection';
import { Transaction } from '../../transaction';

describe('TransactionGossipProtocol', () => {
  let mempool: TransactionMempool;
  let gossipProtocol: TransactionGossipProtocol;
  let peer1: Peer;
  let peer2: Peer;

  beforeEach(() => {
    mempool = new TransactionMempool(null);
    gossipProtocol = new TransactionGossipProtocol(mempool);
    peer1 = { sendTransaction: jest.fn() } as Peer;
    peer2 = { sendTransaction: jest.fn() } as Peer;
  });

  it('should broadcast a new transaction to all peers', () => {
    gossipProtocol.addPeer(peer1);
    gossipProtocol.addPeer(peer2);

    const tx = new Transaction({ ... });
    gossipProtocol.broadcastTransaction(tx);

    expect(peer1.sendTransaction).toHaveBeenCalledWith(tx);
    expect(peer2.sendTransaction).toHaveBeenCalledWith(tx);
  });

  it('should not broadcast a transaction more than once to the same peer', () => {
    gossipProtocol.addPeer(peer1);
    gossipProtocol.addPeer(peer2);

    const tx = new Transaction({ ... });
    gossipProtocol.broadcastTransaction(tx);
    gossipProtocol.broadcastTransaction(tx);

    expect(peer1.sendTransaction).toHaveBeenCalledTimes(1);
    expect(peer2.sendTransaction).toHaveBeenCalledTimes(1);
  });

  it('should remove a peer and its associated transaction knowledge', () => {
    gossipProtocol.addPeer(peer1);
    gossipProtocol.addPeer(peer2);

    const tx = new Transaction({ ... });
    gossipProtocol.broadcastTransaction(tx);

    gossipProtocol.removePeer(peer1);

    const tx2 = new Transaction({ ... });
    gossipProtocol.broadcastTransaction(tx2);

    expect(peer1.sendTransaction).toHaveBeenCalledTimes(1);
    expect(peer2.sendTransaction).toHaveBeenCalledTimes(2);
  });

  it('should cleanup old transaction entries', () => {
    jest.spyOn(mempool, 'getTransactionTimestamp').mockReturnValue(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    gossipProtocol.addPeer(peer1);
    gossipProtocol.addPeer(peer2);

    const tx = new Transaction({ ... });
    gossipProtocol.broadcastTransaction(tx);

    gossipProtocol.cleanup();

    expect(gossipProtocol['knownTransactions'].size).toBe(0);
  });
});