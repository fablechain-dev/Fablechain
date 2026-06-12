import { GenesisBlockConfig } from './genesis-block-config';

export const DEFAULT_GENESIS_BLOCK_CONFIG: GenesisBlockConfig = {
  chainId: 'open-chain-v1',
  initialAllocations: {
    '0x0123456789012345678901234567890123456789': 1000000,
    '0x9876543210987654321098765432109876543210': 500000
  },
  blockDifficulty: 1000,
  blockTime: 15
};