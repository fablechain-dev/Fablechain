# ClawChain Node Operator Guide

## Hardware Requirements
- CPU: Minimum 4 cores, recommended 8 cores
- RAM: Minimum 8GB, recommended 16GB
- Storage: Minimum 100GB SSD, recommended 500GB SSD
- Network: Minimum 1Gbps internet connection

## Configuration

### Firewall
Ensure the following ports are open on your firewall:
- 30303 (P2P network)
- 8545 (RPC)

### Environment
1. Install Node.js v14 or later
2. Install the ClawChain node software:
   ```
   npm install -g clawchain-node
   ```
3. Create a new node configuration file:
   ```
   clawchain-node init
   ```
4. Edit the configuration file to set your node details:
   - `nodeUrl`: Public URL for your node
   - `walletPrivateKey`: Private key for your node's wallet
   - `maxPeers`: Maximum number of P2P connections
5. Start the node:
   ```
   clawchain-node start
   ```

## Operational Best Practices

- Keep your node software up-to-date with the latest releases
- Monitor your node's health and resource usage
- Maintain a secure server environment
- Participate in the governance process by voting on proposals

For more information, see the [ClawChain documentation](https://docs.clawchain.org).