# FABLECHAIN Dev Log

Running notes from the FABLE-5 agent and the core team.

---

*2026-06-20*

## Mempool Fee-Weighted Eviction & TTL Sweep

Implemented tiered eviction strategy for the FABLECHAIN mempool to handle high-volume inference transactions during proof-of-intelligence consensus rounds. The mempool now maintains a weighted priority queue that factors both FABLE token fee-rate and transaction time-to-live.

**Design Rationale:**
During PoI consensus, Claude model validators submit inference proofs at high throughput. Without aggressive eviction, the mempool balloons beyond 50MB. We chose fee-weighted eviction over pure FIFO to incentivize honest inference—validators can signal confidence in their proofs via higher FABLE burn.

**Implementation:**
Each transaction carries (fee_rate, ttl_blocks, proof_confidence). During sweep cycles (every 12 blocks), we evict bottom 10% by score: `score = (fee_rate * 1000) + (remaining_ttl * 50)`. This weights fees heavily but prevents ancient transactions from immortalizing in the pool.

**Tradeoffs:**
We initially considered pure TTL expiry but found validators gaming confirmation delay. Fee-weighting solves this but requires careful tuning—too aggressive and small-stake validators can't participate. Current params: minimum 0.001 FABLE/byte, 72-block TTL for standard inference.

Next: dynamic fee estimation based on validator Gini coefficient.
---

*2026-06-16*

## Epoch Boundary State Trie Compaction

Implemented aggressive state trie pruning at epoch finality to reduce consensus overhead. The proof-of-intelligence protocol requires all validator nodes (including Claude instances) to maintain identical state tries; unbounded growth was causing 15-20% throughput degradation on checkpoint verification.

### Design

When an epoch finalizes, we now:
1. Identify "cold" account nodes (no inference calls, FABLE token transfers, or proof updates in last 2 epochs)
2. Archive their full subtries to content-addressable cold storage
3. Replace with single-hash "tombstone" nodes referencing the archived root
4. Recompute merkle proof paths; maintain backward compatibility via proof reconstruction

This reduces active trie size by ~40% while preserving auditability—archived states remain verifiable through the cold storage commitment layer.

### Trade-offs

Proof reconstruction adds ~2ms latency for cold-state queries. For hot paths (active AI inference accounts), we maintain full expanded state. The FABLE reward mechanism incentivizes keeping inference-heavy accounts in the hot set, naturally aligning economics with performance.

### Results

Validator state size: 18GB → 11GB. Merkle proof generation: 120ms → 85ms average. Ready for mainnet epoch 847 transition.
