import { Network } from './network';
import { Peer } from './peer';
import { Block } from '../blockchain/block';
import { Transaction } from '../blockchain/transaction';

describe('Network', () => {
  it('should add a new peer', () => {
    const network = new Network();
    network.addPeer('123.456.789.0');
    expect(network.getPeers().length).toEqual(1);
  });

  it('should not add a duplicate peer', () => {
    const network = new Network();
    network.addPeer('123.456.789.0');
    network.addPeer('123.456.789.0');
    expect(network.getPeers().length).toEqual(1);
  });

  it('should remove a peer', () => {
    const network = new Network();
    network.addPeer('123.456.789.0');
    network.addPeer('987.654.321.0');
    network.removePeer('123.456.789.0');
    expect(network.getPeers().length).toEqual(1);
  });

  it('should update peer reputations for valid blocks', () => {
    const network = new Network();
    network.addPeer('123.456.789.0');
    network.addPeer('987.654.321.0');

    const block = new Block([], 0, '');
    block.miner = '123.456.789.0';
    network.handleIncomingBlock(block);

    const [miner, otherPeer] = network.getPeers();
    expect(miner.reputation).toEqual(110);
    expect(otherPeer.reputation).toEqual(95);
  });

  it('should update peer reputations for valid transactions', () => {
    const network = new Network();
    network.addPeer('123.456.789.0');
    network.addPeer('987.654.321.0');
    network.addPeer('456.789.012.3');

    const tx = new Transaction('123.456.789.0', '987.654.321.0', 100);
    network.handleIncomingTransaction(tx);

    const [sender, recipient, otherPeer] = network.getPeers();
    expect(sender.reputation).toEqual(102);
    expect(recipient.reputation).toEqual(102);
    expect(otherPeer.reputation).toEqual(99);
  });
});