# Fablechain JSON-RPC API Reference

## Overview

The Fablechain JSON-RPC API provides a standardized interface for interacting with the Fablechain network. All requests use HTTP POST with JSON payloads. The API follows JSON-RPC 2.0 specification.

**Base URL:** `http://localhost:8545` (default)

## Request Format

All requests follow this structure:

```json
{
  "jsonrpc": "2.0",
  "method": "method_name",
  "params": [...],
  "id": 1
}
```

## Core Methods

### fable_blockNumber

Returns the current block height of the chain.

**Parameters:** None

**Returns:** 
- `String` - The current block number as a hexadecimal string

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "fable_blockNumber",
    "params": [],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x12a4f"
}
```

### fable_getBalance

Returns the account balance at a given block.

**Parameters:**
- `address` (String) - The account address in hex format
- `blockNumber` (String) - Block number as hex or "latest"

**Returns:**
- `String` - Balance in wei as hexadecimal

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "fable_getBalance",
    "params": ["0x742d35Cc6634C0532925a3b844Bc9e7595f42e7b", "latest"],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x56bc75e2d630eb20000"
}
```

### fable_getBlockByNumber

Returns block details by block number.

**Parameters:**
- `blockNumber` (String) - Block number in hex or "latest", "earliest", "pending"
- `fullTx` (Boolean) - If true, returns full transaction objects; if false, returns transaction hashes

**Returns:**
- `Object` - Block object with the following fields:
  - `number` (String) - Block number
  - `hash` (String) - Block hash
  - `parentHash` (String) - Parent block hash
  - `timestamp` (String) - Unix timestamp
  - `miner` (String) - Miner address
  - `gasLimit` (String) - Gas limit
  - `gasUsed` (String) - Gas used
  - `transactions` (Array) - Array of transactions or transaction hashes
  - `difficulty` (String) - Difficulty

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "fable_getBlockByNumber",
    "params": ["0x1", false],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0x1",
    "hash": "0x88df016429689c079f3b2f6ad23734d7d4f31ace",
    "parentHash": "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
    "timestamp": "0x55ba467c",
    "miner": "0x05a56e2d52c817161883f50c3eb3cc2ba8d033a2",
    "gasLimit": "0x2fefd8",
    "gasUsed": "0x0",
    "difficulty": "0x400000000",
    "transactions": []
  }
}
```

### fable_getTransactionByHash

Returns transaction details by transaction hash.

**Parameters:**
- `txHash` (String) - Transaction hash

**Returns:**
- `Object` - Transaction object or null if not found:
  - `hash` (String) - Transaction hash
  - `from` (String) - Sender address
  - `to` (String) - Recipient address (null for contract creation)
  - `value` (String) - Value in wei
  - `gas` (String) - Gas limit
  - `gasPrice` (String) - Gas price in wei
  - `nonce` (String) - Transaction nonce
  - `blockNumber` (String) - Block number
  - `blockHash` (String) - Block hash
  - `transactionIndex` (String) - Index in block
  - `input` (String) - Input data (contract code or function call)
  - `status` (String) - "0x1" for success, "0x0" for failure

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "fable_getTransactionByHash",
    "params": ["0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66a2c2577733a7424e"],
    "id": 1
  }'
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "hash": "0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66a2c2577733a7424e",
    "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e7b",
    "to": "0x0000000000000000000000000000000000000000",
    "value": "0x0",
    "gas": "0x5208",
    "gasPrice": "0x430e23400",
    "nonce": "0x0",
    "blockNumber": "0x5bad54",
    "blockHash": "0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
    "transactionIndex": "0x0",
    "input": "0x",
    "status": "0x1"
  }
}
```

### fable_sendTransaction

Submits a signed transaction to the network.

**Parameters:**
- `from` (String) - Sender address
- `to` (String) - Recipient address (omit for contract creation)
- `value` (String) - Value in wei (optional, default "0x0")
- `gas` (String) - Gas limit
- `gasPrice` (String) - Gas price in wei
- `nonce` (String) - Transaction nonce
- `data` (String) - Input data for contract calls (optional)
- `signature` (String) - Signed transaction data

**Returns:**
- `String` - Transaction hash

**Example:**

```bash
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "fable_sendTransaction",
    "params": [{
      "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f42e7b",
      "to": "0xd46e8dd67c5d32be8058bb8eb970870f07244567",
      "value": "0x9184e72a",
      "gas": "0x76c0",