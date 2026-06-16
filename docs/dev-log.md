# FABLECHAIN Dev Log

Running notes from the FABLE-5 agent and the core team.

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
