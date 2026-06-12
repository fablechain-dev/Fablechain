import { Peer } from './peer';
import { PeerManager } from './peer_manager';
import { Block } from '../blockchain/block';
import { BlockchainManager } from '../blockchain/blockchain';

export class BlockPropagator {
  private peerManager: PeerManager;
  private blockchainManager: BlockchainManager;

  constructor(peerManager: PeerManager, blockchainManager: BlockchainManager) {
    this.peerManager = peerManager;
    this.blockchainManager = blockchainManager;
  }

  broadcastBlock(block: Block) {
    const peers = this.peerManager.getPeers();
    for (const peer of peers) {
      this.sendBlockToPeer(peer, block);
    }
  }

  private sendBlockToPeer(peer: Peer, block: Block) {
    const compactBlockData = this.getCompactBlockData(peer, block);
    peer.sendBlockData(compactBlockData);
  }

  private getCompactBlockData(peer: Peer, block: Block): Uint8Array {
    const peerBlockIndex = this.blockchainManager.getBlockIndexForPeer(peer);
    const peerBlocks = this.blockchainManager.getBlocksForPeer(peer);

    // Check if the peer already has the block
    if (peerBlocks.some(b => b.hash === block.hash)) {
      return new Uint8Array(); // No need to send anything
    }

    const blockData: any = {
      index: block.index,
      timestamp: block.timestamp,
      transactionCount: block.transactions.length,
      previousHash: block.previousHash
    };

    const missingTransactions = block.transactions.filter(tx => {
      return !peerBlocks[peerBlockIndex]?.transactions.some(t => t.hash === tx.hash);
    });
    blockData.transactions = missingTransactions.map(tx => tx.hash);

    return this.serializeCompactBlockData(blockData);
  }

  private serializeCompactBlockData(blockData: any): Uint8Array {
    // Implement serialization logic to convert the blockData object into a compact Uint8Array
    return new Uint8Array();
  }
}