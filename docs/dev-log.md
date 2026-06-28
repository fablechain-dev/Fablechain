# FABLECHAIN Dev Log

Running notes from the FABLE-5 agent and the core team.

---

*2026-06-28*

## Agent Reputation Scoring v0.2: Decay Mechanics & Quality Signals

Finalized the core reputation state machine today. Previous iteration was too static—agents could coast on historical performance forever. Now implementing exponential decay with inference quality anchoring.

**Key design decisions:**

1. **Decay function**: `reputation(t) = base * (0.95 ^ weeks_inactive)`. Keeps scores fresh without aggressive penalization. Tested against simulated agent populations; 5% weekly decay prevents sybil-style reputation hoarding while giving legitimate agents 14 weeks to recover from a bad epoch.

2. **Inference quality signals**: Anchored reputation updates to three on-chain metrics: (a) proof-of-intelligence challenge success rate, (b) consensus deviation (via Bayesian voting), (c) gas-efficiency of inference calldata. Weighted 40/40/20 respectively. The gas efficiency term prevents agents from inflating scores through redundant model calls.

3. **Slashing threshold**: Agents below 0.3 reputation enter quarantine—their PoI responses still count toward finality, but they earn zero FABLE rewards until recovery. Hard fork checkpoint required to exit quarantine.

**Tradeoff**: Stricter decay helps network security but risks churning casual validators. Mitigation: bootstrap period (first 90 days) uses 50% reduced decay.

Next: integrate with validator selection weighting and backtest against adversarial agent models.
---

*2026-06-27*

## Cross-Shard Receipt Verification Protocol

Completed initial implementation of the receipt verification layer for inter-shard consensus. The core challenge: Claude validators operating on different shards need cryptographic proof that a transaction was finalized on a remote shard without requiring full chain sync.

We're using a merkle tree accumulator pattern where each shard commits a root hash every 32 blocks. Remote validators can then verify membership in O(log n) time by requesting a merkle proof from the shard's light client contract. This keeps FABLE token stake requirements manageable—validators no longer need to mirror entire shard states.

Design decision: chose Keccak-256 over BLAKE3 for EVM compatibility, even though BLAKE3 is faster. The proof size overhead (32 bytes per level) is negligible for typical shard depths (<20 levels), and we gain interop with existing tooling.

One remaining tradeoff: proof batching. If a validator needs to verify receipts from 100 transactions across 3 shards, we're currently issuing 3 separate RPC calls. Next sprint will implement batch proof aggregation to reduce network round-trips by ~70%.

Proof-of-intelligence contribution: validators now earn 1.5x FABLE rewards for hosting light clients on remote shards—incentivizes decentralized participation in cross-shard consensus.
---

*2026-06-26*

## Deterministic Inference Notarization Layer

Completed the core notarization pipeline for Claude model inferences on FABLECHAIN. The challenge: proving that a specific model run with specific inputs produced a specific output, deterministically, without revealing the full inference trace to validators.

**Design Decision**: Rather than committing full inference logs (storage bloat), we now commit a three-layer hash structure:
1. **Input Hash** — SHA3(prompt + system_context + temperature=0 + seed)
2. **Model State Hash** — Blake3(model_weights_version + quantization_params)
3. **Output Commitment** — Merkle root of token-by-token logits at sampling positions

This lets validators reproduce the exact inference path without storing gigabytes of intermediate states. Temperature is pinned to 0.0 for determinism; we sacrifice sampling diversity for consensus auditability.

**Tradeoff**: Validators must hold model weights locally. We're exploring weight CDN distribution, but for MVP, nodes running PoI consensus need ~7GB VRAM per Claude model. This caps validator set size but ensures genuine intelligence participation—no oracle delegation.

**FABLE Mechanics**: Successful notarization earns base 10 FABLE tokens; validators get 0.5 FABLE for successful verification. Failed reproduction (hash mismatch) triggers slashing review.

Next: integrate with mempool, write validator harness tests.
---

*2026-06-24*

## Push-Based Block Gossip & Peer Scoring

Migrated from pull-based block requests to push-based gossip to reduce latency and improve throughput for PoI consensus. Each Claude validator now maintains a peer score map tracking:
- Block propagation speed (lower quartile = higher score)
- Proof-of-intelligence validation accuracy (scored against finalized blocks)
- FABLE token stake (weighted exponentially)
- Uptime ratio over 256-block windows

When a block is produced, the validator immediately broadcasts to its top-K peers (K = 12 + sqrt(peer_count)). Peers scoring below 0.4 are starved of push messages; they must explicitly pull via RPC.

**Key tradeoff**: Push gossip increases bandwidth ~3.2x but reduces block latency from 890ms to 280ms p95. This matters because our PoI layer requires <500ms block validity proofs from Claude inference attestations.

Implemented exponential backoff for failed pushes and circuit-breaker logic to prevent cascading gossip loops. Peer scores decay 2% per epoch to allow recovery paths.

The FABLE token burn for slow propagation is now enforced at the application layer (not protocol), giving validators 3 epochs to improve scoring before economic penalties kick in.
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
