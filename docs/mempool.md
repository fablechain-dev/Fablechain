# Fablechain Mempool Design

## Overview

The Fablechain mempool is a critical component of the node's transaction processing pipeline. It maintains a pool of unconfirmed transactions, manages resource constraints, and enforces consensus rules to ensure network stability and security.

## Fee Market

### Dynamic Fee Calculation

The mempool implements a dynamic fee market mechanism that adjusts transaction acceptance thresholds based on network congestion:

```
baseFee = calculateMedianGasPrice(lastBlockTransactions)
priorityFee = min(transactionGasPrice - baseFee, maxPriorityFee)
effectiveGasPrice = baseFee + priorityFee
```

Transactions are accepted only when `effectiveGasPrice >= minAcceptableFeePerGas`. During congestion, this threshold increases exponentially:

```
minAcceptableFeePerGas = baseFee * (1 + congestionRatio^2)
congestionRatio = currentMempoolSize / maxMempoolSize
```

### Fee Bumping

Users can replace pending transactions by submitting a new transaction with:
- Same nonce as the original
- Gas price at least 125% higher than the original
- Equal or greater gas limit

This allows users to accelerate transactions during network congestion without resubmitting identical data.

## Eviction Policy

When the mempool exceeds capacity (10MB default), transactions are evicted based on the following priority:

1. **Fee Rate Score**: `score = effectiveGasPrice / transactionSize`
2. **Age Threshold**: Transactions older than 6 hours are evicted first
3. **Origin Reputation**: Peer-provided transactions evicted before locally-submitted ones
4. **Dependency Count**: Transactions with high dependents are preserved to maintain chain integrity

The eviction process continues until mempool size falls below 90% of maximum capacity.

## Ordering Algorithm

### Transaction Ordering

The mempool maintains transactions in a priority queue ordered by:

1. **Effective Fee Rate**: Higher fee-per-byte transactions processed first
2. **Dependency Resolution**: Ancestor transactions before descendants
3. **Nonce Ordering**: Strictly enforced sequential nonce ordering within accounts
4. **Timestamp**: Earlier transactions prioritized during fee ties

When constructing blocks, nodes build transaction sets greedily from the top of the queue, skipping any transaction whose ancestors aren't included.

### Package Transactions

Related transactions (e.g., a swap with approval) are grouped into packages:

```
Package = {
  transactions: Transaction[],
  totalFee: Satoshi,
  totalSize: Bytes,
  feeRate: Satoshi/Byte,
  ancestorCount: Number,
  dependantCount: Number
}
```

Packages are indivisible during selection, allowing high-value transaction chains to be included together.

## Anti-Spam Protections

### Rate Limiting

Per-peer transaction rate limits prevent flooding:

- **5 transactions per second** from remote peers
- **100 transactions per second** from local submission
- **Sliding window enforcement** across 10-second intervals

Peers exceeding limits receive reduced bandwidth and connection priority.

### Account Constraints

Each account can hold maximum **10 transactions** pending confirmation:

```
maxPendingByAccount = 10
maxPendingByAccountBytes = 500KB
```

Exceeding this requires higher fee rates to displace existing transactions.

### Double-Spend Prevention

The mempool maintains strict conflict detection:

- Transactions spending identical outputs are rejected
- Only the highest-fee conflicting transaction remains in the pool
- Transactions are atomic at the output level

### Dust Rejection

Transactions creating outputs below dust limit (546 satoshis) are rejected unless:
- They include sufficient fee rate (> 1000 sat/vB)
- Explicitly flagged with `acceptDustOutputs` by node operator

### Contract Interaction Limits

For smart contract transactions:

- **Maximum 25 pending contract calls** per contract address
- **Maximum 5MB total size** of pending contract data
- **Calldata validation** to prevent oversized payloads

## Monitoring and Metrics

The mempool exports metrics for operational visibility:

- `mempool.size_bytes`: Current mempool size
- `mempool.transaction_count`: Number of pending transactions
- `mempool.min_fee_rate`: Minimum accepted fee rate
- `mempool.average_fee_rate`: Mean fee rate in pool
- `mempool.eviction_rate`: Transactions evicted per minute
- `mempool.broadcast_latency`: Time from acceptance to relay (milliseconds)

These metrics inform fee estimation and network health assessment.