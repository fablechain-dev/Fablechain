```typescript
import * as dotenv from 'dotenv';

dotenv.config();

export enum NetworkName {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
  LOCAL = 'local',
}

export interface BootstrapPeer {
  peerId: string;
  addresses: string[];
  publicKey: string;
}

export interface NetworkConfigInterface {
  name: NetworkName;
  chainId: number;
  protocolVersion: string;
  consensusType: 'proof-of-stake' | 'proof-of-authority';
  blockTime: number;
  maxBlockSize: number;
  maxTransactionSize: number;
  maxGasPerBlock: number;
  minGasPrice: string;
  bootstrapPeers: BootstrapPeer[];
  dnsSeeds: string[];
  rpcPort: number;
  p2pPort: number;
  wsPort: number;
  genesisBlock: {
    hash: string;
    timestamp: number;
    difficulty: number;
    nonce: string;
  };
  targetBlockTime: number;
  difficulty: {
    initial: number;
    minTarget: string;
    maxTarget: string;
    adjustmentInterval: number;
  };
  transactionPool: {
    maxSize: number;
    maxMemoryBytes: number;
    expirationTime: number;
  };
  validators?: {
    initialCount: number;
    minStake: string;
    maxStake: string;
    slashingPercentage: number;
  };
  timeouts: {
    blockFetch: number;
    peerHandshake: number;
    transactionBroadcast: number;
  };
}

const MAINNET_CONFIG: NetworkConfigInterface = {
  name: NetworkName.MAINNET,
  chainId: 1,
  protocolVersion: '1.0.0',
  consensusType: 'proof-of-stake',
  blockTime: 12000,
  maxBlockSize: 2097152,
  maxTransactionSize: 131072,
  maxGasPerBlock: 30000000,
  minGasPrice: '1000000000',
  rpcPort: 8545,
  p2pPort: 30303,
  wsPort: 8546,
  dnsSeeds: [
    'seed1.fablechain.io',
    'seed2.fablechain.io',
    'seed3.fablechain.io',
  ],
  bootstrapPeers: [
    {
      peerId: '12D3KooWQakmT9gQ6o9kbZvKXX8vCJqKPR4nati2nHm8zTaCoqq9',
      addresses: [
        '/dns4/bootstrap1.fablechain.io/tcp/30303/p2p/12D3KooWQakmT9gQ6o9kbZvKXX8vCJqKPR4nati2nHm8zTaCoqq9',
      ],
      publicKey: '0x02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1',
    },
    {
      peerId: '12D3KooWRkp7Zxk4hq7jL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0kL1mN2o',
      addresses: [
        '/dns4/bootstrap2.fablechain.io/tcp/30303/p2p/12D3KooWRkp7Zxk4hq7jL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8gH9iJ0kL1mN2o',
      ],
      publicKey: '0x03b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
    },
  ],
  genesisBlock: {
    hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
    timestamp: 1704067200000,
    difficulty: 1000000,
    nonce: '0x0000000000000000000000000000000000000000000000000000000000000000',
  },
  targetBlockTime: 12000,
  difficulty: {
    initial: 1000000,
    minTarget: '0x00000000ffff0000000000000000000000000000000000000000000000000000',
    maxTarget: '0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    adjustmentInterval: 2016,
  },
  transactionPool: {
    maxSize: 10000,
    maxMemoryBytes: 536870912,
    expirationTime: 86400000,
  },
  validators: {
    initialCount: 32,
    minStake: '32000000000000000000',
    maxStake: '32000000000000000000000',
    slashingPercentage: 32,
  },
  timeouts: {
    blockFetch: 30000,
    peerHandshake: 10000,
    transactionBroadcast: 5000,
  },
};

const TESTNET_CONFIG: NetworkConfigInterface = {
  name: NetworkName.TESTNET,
  chainId: 42,
  protocolVersion: '1.0.0',
  consensusType: 'proof-of-stake',
  blockTime: 6000,
  maxBlockSize: 2097152,
  maxTransactionSize: 131072,
  maxGasPerBlock: 15000000,
  minGasPrice: '1000000',
  rpcPort: 8545,
  p2pPort: 30304,
  wsPort: 8546,
  dnsSeeds: [
    'seed1.testnet.fablechain.io',
    'seed2.testnet.fablechain.io',
  ],
  bootstrapPeers: [
    {
      peerId: '12D3KooWHLHBLCKNSPoSfT8kvCtQNWtn2ND7wq87E8V9e7T7LQCX',
      addresses: [
        '/dns4/bootstrap1.testnet.fablechain.io/tcp/30304/p2p/12D3KooWHLHBLCKNSPoSfT8kvCtQNWtn2ND7wq87E8V9e7T7LQCX',
      ],
      publicKey: '0x04c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
    },
  ],
  genesisBlock: {
    hash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    timestamp: 1704153600000,
    difficulty: 100000,
    nonce: '0x0000000000000000000000000000000000000000000000000000000000000001',
  },
  targetBlockTime: 6000,
  difficulty: {
    initial: 100000,
    minTarget: '0x00000