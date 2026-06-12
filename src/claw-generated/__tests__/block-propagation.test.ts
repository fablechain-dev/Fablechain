import { BlockPropagator } from '../block_propagator';
import { BlockManager } from '../BlockManager';
import { PeerManager } from '../peer_manager';
import { Peer } from '../peer';
import { Block } from '../blockchain/block';

describe('BlockPropagator', () => {
  let peerManager: PeerManager;
  let blockManager: BlockManager;
  let blockPropagator: BlockPropagator;

  beforeEach(() => {
    peerManager = new PeerManager();
    blockManager = new BlockManager(new BlockPropagator(peerManager, blockManager));
    blockPropagator = new BlockPropagator(peerManager, blockManager);
  });

  test('should broadcast new blocks to all peers', () => {
    const peer1 = new Peer('peer1', '127.0.0.1:1234');
    const peer2 = new Peer('peer2', '127.0.0.1:5678');
    peerManager.addPeer(peer1);
    peerManager.addPeer(peer2);

    const block = new Block(1, Date.now(), [], '0x1234');
    blockPropagator.broadcastBlock(block);

    expect(peer1.sentBlockData).toEqual(blockPropagator.getCompactBlockData(peer1, block));
    expect(peer2.sentBlockData).toEqual(blockPropagator.getCompactBlockData(peer2, block));
  });

  test('should not send block data to peers that already have the block', () => {
    const peer1 = new Peer('peer1', '127.0.0.1:1234');
    const peer2 = new Peer('peer2', '127.0.0.1:5678');
    peerManager.addPeer(peer1);
    peerManager.addPeer(peer2);

    const block = new Block(1, Date.now(), [], '0x1234');
    blockManager.addBlock(block);

    blockPropagator.broadcastBlock(block);

    expect(peer1.sentBlockData).toEqual(new Uint8Array());
    expect(peer2.sentBlockData).toEqual(new Uint8Array());
  });
});