import { Account, BlockHeader, ChainParameters } from './types';
import { keccak256 } from 'js-sha3';

export interface GenesisConfig {
  accounts: Account[];
  parameters: ChainParameters;
  chainId: string;
}

function serializeBlockHeader(header: BlockHeader): Uint8Array {
  const data = new Uint8Array(
    8 + // number
    8 + // timestamp
    32 + // parentHash
    32 + // hash
    8 + // gasLimit
    8 + // gasUsed
    20 + // miner
    8 + // difficulty
    header.extraData.length // extraData
  );

  let offset = 0;
  data.set(new Uint8Array(header.number.toString(16).padStart(16, '0'), 'hex'), offset);
  offset += 8;
  data.set(new Uint8Array(header.timestamp.toString(16).padStart(16, '0'), 'hex'), offset);
  offset += 8;
  data.set(new Uint8Array(header.parentHash.slice(2), 'hex'), offset);
  offset += 32;
  data.set(new Uint8Array(header.miner.slice(2), 'hex'), offset);
  offset += 20;
  data.set(new Uint8Array(header.difficulty.toString(16).padStart(16, '0'), 'hex'), offset);
  offset += 8;
  data.set(new Uint8Array(header.gasLimit.toString(16).padStart(16, '0'), 'hex'), offset);
  offset += 8;
  data.set(new Uint8Array(header.gasUsed.toString(16).padStart(16, '0'), 'hex'), offset);
  offset += 8;
  data.set(new TextEncoder().encode(header.extraData), offset);

  return data;
}

export function generateGenesisBlock(config: GenesisConfig): BlockHeader {
  const { accounts, parameters, chainId } = config;

  // Initialize genesis block header
  const blockHeader: BlockHeader = {
    number: 0,
    timestamp: Math.floor(Date.now() / 1000),
    hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    gasLimit: parameters.initialGasLimit,
    gasUsed: 0,
    miner: '0x0000000000000000000000000000000000000000',
    difficulty: parameters.initialDifficulty,
    extraData: `ClawChain Genesis Block - Chain ID: ${chainId}`,
  };

  // Calculate block hash
  const serializedHeader = serializeBlockHeader(blockHeader);
  blockHeader.hash = '0x' + keccak256(serializedHeader);

  return blockHeader;
}

export function validateGenesisConfig(config: GenesisConfig): boolean {
  // TODO: Implement genesis block configuration validation
  return true;
}