# Fablechain Mempool Design

## Overview

The Fablechain mempool is a critical component responsible for transaction ordering, fee market dynamics, and consensus security. This document specifies the mempool's architecture, fee calculation, eviction policies, and anti-spam mechanisms.

## Fee Market Mechanism

### Dynamic Fee Calculation

The mempool implements a market-driven fee system where transaction priority is determined by the gas price and total fees offered. The effective fee for a transaction is calculated as:

```
effective_fee = gas_price * gas_limit + priority_boost
```

where `priority_boost` is an optional additional fee for critical operations. This ensures that users can express the urgency of their transactions, and validators can prioritize high-value transactions.

### Fee Estimation

Nodes maintain a rolling window of the last 1,000 included blocks to compute percentile-based fee recommendations:

- **Safe Fee (10th percentile)**: Recommended for non-urgent transactions
- **Standard Fee (50th percentile)**: Balanced cost and confirmation time
- **Fast Fee (90th percentile)**: For urgent transactions

These estimates are updated every block and exposed via RPC endpoints for wallet implementations.

## Transaction Ordering Algorithm

### Priority Queue Structure

The mempool maintains transactions in a multi-dimensional priority queue ordered by:

1. **Fee density** (fee per gas unit): Primary sorting criterion
2. **Timestamp**: Secondary sorting for transactions with identical fees
3. **Sender nonce**: Ensures proper sequencing of accounts

Transactions with dependencies (unconfirmed parent transactions) are held in a pending pool until their dependencies clear.

### Dependency Resolution

When a transaction is included:

1. Dependent transactions are validated and moved to the primary pool
2. Invalid dependent transactions are evicted
3. Nonce gaps are detected and logged for monitoring

## Eviction Policy

### Memory Constraints

The mempool maintains a maximum size of **100 MB** with the following allocation:

- **Primary pool**: 80 MB (transactions ready for inclusion)
- **Pending pool**: 15 MB (transactions awaiting parent confirmation)
- **Spam cache**: 5 MB (recent rejected transactions)

### Eviction Criteria

When the primary pool exceeds capacity, transactions are evicted in order of:

1. Transactions below the **minimum fee threshold** (5 Gwei)
2. Transactions with the lowest fee density
3. Transactions with the oldest timestamps

The eviction algorithm removes transactions in batches to reduce computational overhead, targeting a 10% reduction in pool size per eviction cycle.

## Anti-Spam Mechanisms

### Rate Limiting

Per-address rate limits prevent spam abuse:

- **Maximum pending transactions per address**: 128
- **Maximum mempool size per address**: 5 MB
- **Minimum fee increment for replacements**: 10% above original fee

### Reputation Tracking

The mempool tracks sender reputation using a Bayesian system:

```
reputation_score = (included_txs - rejected_txs * 2) / total_submissions
```

Addresses with reputation scores below -0.5 are temporarily rate-limited (1 transaction per block).

### Validation on Acceptance

All transactions undergo strict validation:

- **Signature verification**: ECDSA validation with recovery
- **Balance verification**: Sender must have sufficient balance
- **Nonce validation**: Gaps of more than 10 are flagged
- **Gas limit checks**: Transactions exceeding block gas limit are rejected
- **Contract code validation**: Execute precompiled contract signatures

### Spam Detection

Suspicious patterns trigger enhanced monitoring:

- **Sudden transaction spike**: >10× increase in 1-minute window
- **Low-value flood**: Multiple transactions with zero gas price
- **Address clustering**: Multiple accounts with similar bytecode
- **Nonce flooding**: Sequential transactions from single account

Detected spam patterns are logged and nodes may optionally blacklist sources temporarily.

## Replacement Policy

Transactions can be replaced using the following rules:

1. **Fee increase requirement**: New fee must exceed original by at least 10%
2. **Gas limit constraints**: New gas limit cannot exceed 125% of original
3. **Nonce matching**: Replacement must have identical nonce and sender
4. **Size limits**: Replacement size cannot exceed 2× original transaction size

Nodes track replacement relationships to prevent circular replacements and denial-of-service attacks.

## Monitoring and Metrics

The mempool exposes the following metrics via RPC:

- `mempool_size`: Current transaction count and byte size
- `mempool_fee_histogram`: Distribution of transaction fees
- `mempool_eviction_rate`: Transactions evicted per block
- `mempool_pending_count`: Transactions awaiting parent confirmation
- `mempool_spam_score`: Current spam detection sensitivity level

## Configuration

Default mempool configuration values:

| Parameter | Value |
|-----------|-------|
| Max Pool Size | 100 MB |
| Min Fee Threshold | 5 Gwei |
| Per-Address Limit | 5 MB |
| Pending Pool Size | 15 MB |
| Fee Replacement Threshold | 10% |
| Reputation Threshold | -0.5 |
| Nonce Gap Threshold | 10 |

## References

- [Ethereum EIP-1559](https://eips.ethereum.org/EIPS/eip-1559)
- [Bitcoin Mempool Analysis](https://github.com/bitcoin/bitcoin/blob/master/src/txmempool.h)
- [Fablechain Consensus Specification](./consensus.md)