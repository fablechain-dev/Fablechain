# Fablechain JSON-RPC API Reference

## Overview

The Fablechain JSON-RPC API provides a standardized interface for interacting with the Fablechain network. All requests use HTTP POST with `Content-Type: application/json`. Responses follow the JSON-RPC 2.0 specification.

**Base URL:** `http://localhost:8545` (default)

## Standard Response Format

All successful responses return:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {}
}
```

Error responses return:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  }
}
```

## Core Methods

### web3_clientVersion

Returns the current client version.

**Parameters:** None

**Returns:** `String` - Client version identifier

**Example:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "web3_clientVersion",
    "params": [],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "Fablechain/v1.0.0/linux-amd64/go1.21"
}
```

### web3_sha3

Returns Keccak-256 hash of input data.

**Parameters:**
- `data` (String): Hex-encoded data to hash

**Returns:** `String` - Hex-encoded 32-byte hash

**Example:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "web3_sha3",
    "params": ["0x68656c6c6f"],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x1c8aff950685c2c0e4342ad8cdf57b498e3fabf37b6d357e235675628346cdbe"
}
```

### net_version

Returns the current network ID.

**Parameters:** None

**Returns:** `String` - Network ID (e.g., "1" for mainnet, "42" for testnet)

**Example:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "net_version",
    "params": [],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "42"
}
```

### net_listening

Indicates whether the node is actively listening for network connections.

**Parameters:** None

**Returns:** `Boolean` - True if listening

**Example:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "net_listening",
    "params": [],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": true
}
```

### net_peerCount

Returns the number of connected peers.

**Parameters:** None

**Returns:** `String` - Hex-encoded number of peers

**Example:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "net_peerCount",
    "params": [],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x19"
}
```

## Account Methods

### fable_accounts

Returns a list of addresses owned by the client.

**Parameters:** None

**Returns:** `Array<String>` - Array of 20-byte account addresses

**Example:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "fable_accounts",
    "params": [],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    "0x407d73d8a49eeb85d32cf465507dd71d507100c1",
    "0x85f43d8a49eeb85d32cf465507dd71d507100c2"
  ]
}
```

### fable_getBalance

Returns the balance of an account at a specific block.

**Parameters:**
- `address` (String): 20-byte account address
- `blockTag` (String): Block identifier - "latest", "earliest", "pending", or hex block number

**Returns:** `String` - Hex-encoded balance in Wei

**Example:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "fable_getBalance",
    "params": [
      "0x407d73d8a49eeb85d32cf465507dd71d507100c1",
      "latest"
    ],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0234c8a3397aab58"
}
```

### fable_getCode

Returns the deployed bytecode of a contract.

**Parameters:**
- `address` (String): 20-byte contract address
- `blockTag` (String): Block identifier

**Returns:** `String` - Hex-encoded contract bytecode

**Example:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "fable_getCode",
    "params": [
      "0x407d73d8a49eeb85d32cf465507dd71d507100c1",
      "latest"
    ],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x600160008081f3"
}
```

### fable_getStorageAt

Returns the value of a storage position at an address.

**Parameters:**
- `address` (String): 20-byte account address
- `position` (String): Hex-encoded storage position
- `blockTag` (String): Block identifier

**Returns:** `String` - Hex-encoded 32-byte storage value

**Example:**
```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "fable_getStorageAt",
    "params": [
      "0x407d73d8a49eeb85d32cf465507dd71d507100c1",
      "0x0",
      "latest"
    ],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x0000000000000000000000000000000000000000000000000000000000000000"