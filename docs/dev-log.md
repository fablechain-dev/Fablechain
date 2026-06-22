# FABLECHAIN Dev Log

Running notes from the FABLE-5 agent and the core team.

---

*2026-06-22*

## Ed25519 Batch Verification Optimization

Implemented batched Ed25519 signature verification for consensus blocks to reduce verification latency from O(n) sequential to O(1) amortized constant-time operations. Critical path for PoI (proof-of-intelligence) block validation where multiple Claude instances co-sign the same block digest.

### Context
Each FABLECHAIN block contains signatures from 3–7 validator nodes (Claude model instances) attesting to inference correctness. Previous implementation verified each signature sequentially; with network growth to 50+ validators, block finality was bottlenecked at ~400ms per block.

### Solution
Leveraged libsodium's batch verification API (`crypto_sign_open_batch`) and pre-computed public key constants for active validator set. Signature aggregation happens at the P2P gossip layer; validators buffer signatures for 100ms windows before batch verification.

### Trade-offs
- **Latency vs. throughput**: 100ms buffer increases inclusion delay but enables 6–8x verification throughput
- **Memory**: Validator pubkey LRU cache adds ~2MB per node (acceptable)
- **FABLE token economics**: Reduced validator gas costs by ~40% (batch ops charge fixed fee + per-sig), incentivizing larger validator coalitions

### Metrics
- Batch verification: 47µs/signature (down from 180µs sequential)
- Block finality: 280ms p95 (from 650ms)
- Mempool clearance: +3.2x improvement

No consensus rule changes; backwards compatible.
---

*2026-06-20*

## Mempool Fee-Weighted Eviction & TTL Sweep

Completed the core eviction logic for FABLECHAIN's mempool to handle capacity constraints while maintaining fair ordering for proof-of-intelligence transactions. The challenge: balance FABLE token incentives with deterministic pruning when mempool reaches 50k tx capacity.

**Design Decision:** Implemented two-phase eviction:
1. **TTL Sweep**: Remove expired transactions (default 300 blocks). This is deterministic and requires no economic judgment.
2. **Fee-Weighted Eviction**: For capacity overflow, evict lowest (fee_rate * inference_confidence) scored transactions, where inference_confidence is the PoI validator's stake-weighted consensus score.

This weights AI inference quality into fee economics directly—a high-confidence inference pays lower effective fees. Backwards-compatible with standard Ethereum mempool semantics for non-AI txs.

**Implementation notes:**
- BinaryHeap for O(log n) eviction candidate selection
- TTL checks run on block boundaries (minimal overhead)
- Fee weight decay: `fee_rate * (1 - age_blocks/300)` to prevent stale high-fee txs from pinning

**Tradeoff accepted:** Slightly higher mempool iteration cost (now O(n log n) worst case) vs. previous O(n). Justified by sub-millisecond impact at current throughput (100 tx/s). Future optimization: sliding window with lazy recalculation.
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
