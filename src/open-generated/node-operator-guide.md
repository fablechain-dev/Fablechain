# OpenChain Node Operator Guide

## Hardware Requirements
- CPU: Minimum 4 cores, recommended 8 cores or more
- RAM: Minimum 8GB, recommended 16GB or more
- Storage: Minimum 500GB SSD, recommended 1TB SSD or more
- Network: Minimum 100Mbps internet connection, recommended 1Gbps or more

## Configuration

### Ports
- P2P port: 30333
- RPC port: 9933

### Flags
- `--chain=openchain`: Specify the OpenChain network to connect to
- `--base-path=/path/to/data`: Set the base directory for node data
- `--pruning=archive`: Keep the full blockchain history (no pruning)
- `--rpc-methods=unsafe`: Allow unsafe RPC methods for better tooling

### Environment Variables
- `RUST_LOG=info`: Set the logging level to info
- `TMPDIR=/path/to/temp`: Set the temporary directory for node data

## Running a Node

1. Install the OpenChain node software
2. Configure your node settings in a `config.toml` file
3. Start the node using the `openchain-node` command with the appropriate flags
4. Wait for the node to sync the blockchain

## Monitoring and Maintenance

- Check node status using the `openchain-node status` command
- Monitor node logs for any errors or warnings
- Keep node software up-to-date by regularly updating to the latest release
- Ensure sufficient disk space and network bandwidth for your node

## Resources
- OpenChain GitHub repository: https://github.com/openchain/openchain
- OpenChain Discord community: https://discord.gg/openchain