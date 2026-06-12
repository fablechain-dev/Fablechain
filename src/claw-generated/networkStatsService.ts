import { BlockManager } from './BlockManager';
import { TransactionManager } from './TransactionManager';
import { PeerManager } from './PeerManager';
import { StateManager } from './StateManager';

export async function getTransactionRate(): Promise<number> {
  const transactionManager = await TransactionManager.getInstance();
  const txCount = await transactionManager.getTransactionCount();
  const blockManager = await BlockManager.getInstance();
  const lastBlock = await blockManager.getLatestBlock();
  const blockTime = lastBlock.timestamp - (await blockManager.getBlock(lastBlock.parentHash)).timestamp;
  return txCount / blockTime;
}

export async function getAverageBlockTime(): Promise<number> {
  const blockManager = await BlockManager.getInstance();
  const lastBlocks = await blockManager.getLastNBlocks(10);
  const totalTime = lastBlocks.reduce((total, block) => {
    if (block.parentHash) {
      return total + (block.timestamp - (await blockManager.getBlock(block.parentHash)).timestamp);
    }
    return total;
  }, 0);
  return totalTime / lastBlocks.length;
}

export async function getMiningDifficulty(): Promise<number> {
  const stateManager = await StateManager.getInstance();
  const currentDifficulty = await stateManager.getDifficulty();
  return currentDifficulty;
}

export async function getNetworkHashrate(): Promise<number> {
  const blockManager = await BlockManager.getInstance();
  const lastBlocks = await blockManager.getLastNBlocks(10);
  const totalTime = lastBlocks.reduce((total, block) => {
    if (block.parentHash) {
      return total + (block.timestamp - (await blockManager.getBlock(block.parentHash)).timestamp);
    }
    return total;
  }, 0);
  const totalHashrate = lastBlocks.length / (totalTime / 10);
  return totalHashrate;
}

export async function getActiveAddresses(): Promise<number> {
  const peerManager = await PeerManager.getInstance();
  const peers = await peerManager.getPeers();
  const activeAddresses = new Set();
  for (const peer of peers) {
    activeAddresses.add(peer.address);
  }
  return activeAddresses.size;
}