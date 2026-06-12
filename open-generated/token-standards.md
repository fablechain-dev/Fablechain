# OpenChain Token Standards

This document outlines the token standards supported by the OpenChain ecosystem.

## ORC-20: Fungible Tokens
The ORC-20 standard defines the interface for fungible, interchangeable tokens on OpenChain. It includes methods for:
- Querying the total supply and individual balances
- Transferring tokens between addresses
- Approving third-party spenders

## ORC-721: Non-Fungible Tokens
The ORC-721 standard defines the interface for non-fungible, unique tokens on OpenChain. It includes methods for:
- Querying token ownership and metadata
- Transferring tokens between addresses
- Approving third-party operators

The specific implementations of these standards are found in the `contracts/` directory. Developers building on OpenChain should refer to this documentation when integrating token functionality.