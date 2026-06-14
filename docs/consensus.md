# Fablechain Proof-of-Intelligence Consensus

## Overview

Fablechain implements a novel Proof-of-Intelligence (PoI) consensus mechanism that combines stake-weighted validator selection with intelligence-based performance metrics. Unlike traditional Proof-of-Stake systems, PoI incorporates real-time validator behavior analysis, transaction processing efficiency, and network contribution quality into consensus weight calculations.

The consensus protocol operates in discrete rounds, each lasting approximately 12 seconds. Validators are selected probabilistically based on their staked FBL tokens and historical intelligence scores. Selected validators propose blocks; other validators attest to block validity through weighted signatures.

## Protocol Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FABLECHAIN CONSENSUS LAYER                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Intelligence    │  │   Stake Weight   │  │  Fork Choice │  │
│  │   Calculation    │  │   Committee      │  │    Rules     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                   │          │
│  ┌────────▼─────────────────────▼───────────────────▼────────┐ │
│  │           Validator Selection Engine                      │ │
│  │  - Weighted Random Selection                             │ │
│  │  - Dynamic Committee Composition                         │ │
│  │  - Reputation Scoring                                   │ │
│  └────────┬─────────────────────────────────────────────────┘ │
│           │                                                    │
│  ┌────────▼────────────────────────────────────────────────┐  │
│  │              Block Production & Attestation            │  │
│  │  - Block Proposal (Slot Leader)                        │  │
│  │  - Attestation Aggregation                             │  │
│  │  - Signature Verification & Batching                   │  │
│  └────────┬─────────────────────────────────────────────────┘  │
│           │                                                    │
│  ┌────────▼────────────────────────────────────────────────┐  │
│  │         Finality & Fork Resolution Layer               │  │
│  │  - Supermajority Thresholds (⅔+)                       │  │
│  │  - LMD-GHOST Fork Choice Rule                          │  │
│  │  - Checkpoints & Justification                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Round Lifecycle

Each consensus round comprises the following phases:

### Phase 1: Slot Allocation (0-3 seconds)

The validator set for the current epoch (approximately 30,240 slots) is determined at epoch boundary. Within each slot, a single proposer is selected using weighted random selection:

```
proposer_index = hash(
  current_slot ||
  validator_pubkey ||
  randao_reveal
) % active_validator_count

selection_weight = 
  (validator_stake / total_stake) * 
  (intelligence_score / max_intelligence_score) *
  (1 - (slashing_penalties / initial_stake))
```

The proposer receives cryptographic sortition proofs and begins block construction.

### Phase 2: Block Proposal (3-6 seconds)

The selected proposer:
- Aggregates pending transactions from the mempool
- Executes transactions and computes state root
- Constructs a block header with:
  - `parent_root`: Hash of previous block
  - `state_root`: Root of state tree after execution
  - `body_root`: Root of all transactions and data
  - `randao_reveal`: VRF output for entropy
  - `timestamp`: Unix seconds
  - `proposer_index`: Validator index
  - `slot`: Current slot number

- Broadcasts block via P2P network within 4-second window

### Phase 3: Attestation (6-9 seconds)

Non-proposer validators in the committee independently:
- Validate block structure and signatures
- Verify state transitions and transaction execution
- Compute local state root and compare
- Create attestation:
  ```
  {
    aggregation_bits: BitVector[COMMITTEE_SIZE],
    data: {
      slot: current_slot,
      index: committee_index,
      beacon_block_root: hash(block),
      source_checkpoint: last_justified_checkpoint,
      target_checkpoint: current_epoch_checkpoint
    },
    signature: BLS_signature
  }
  ```
- Broadcast attestations via gossip network

### Phase 4: Aggregation & Finalization (9-12 seconds)

Aggregators combine multiple attestations:
- Collect compatible attestations (same target, source, block_root)
- Aggregate signatures using BLS curve operations
- Publish aggregated attestation

Network reaches consensus when:
- Total attesting stake ≥ ⅔ of committee
- All attestations point to same block
- Intelligence scores confirm validator honesty

## Validator Duties

### Primary Responsibilities

**Block Proposal**
- Validate mempool transactions
- Limit block to 2 MB
- Order transactions by fee weight
- Execute and commit to state
- Broadcast within slot window
- Reward: 2 FBL + transaction fees

**Committee Attestation**
- Monitor assigned committee slot
- Validate proposed block
- Create and broadcast attestation
- Reward: 0.25 FBL per epoch per committee slot

**Slashing Prevention**
- Never propose two blocks in same slot
- Never attest to competing forks
- Never create contradictory attestations
- Penalty: 32 FBL minimum + full stake destruction

### Intelligence Score Calculation

```
intelligence_score(v) = 
  0.30 * attestation_inclusion_rate(v) +
  0.25 * block_proposal_quality(v) +
  0.20 * latency_efficiency(v) +
  0.15 * transaction_validity_score(v) +
  0.10 * network_participation_score(v)
  
where:

attestation_inclusion_rate = 
  (attestations_included_in_blocks / total_attestations) * 100

block_proposal_quality = 
  (valid_transactions_in_blocks / total_transactions_proposed) * 100

latency_efficiency = 
  max(0, 1 - (actual_latency - target_latency) / 1000ms)

transaction_validity_score = 
  (non_reverted_transactions / total_transactions) * 100

network_participation_score = 
  (uptime_percentage * peer_count) / optimal_peer_count
```

Scores update after each epoch (32 slots). Initial score: 50/100.

## Slashing Conditions

### Equivocation Slashing

Triggered when validator produces multiple blocks or attestations conflicting in the same slot:

```
if exists block_a, block_b where:
  - block_a.proposer == block_b.proposer
  - block_a.slot == block_b.slot
  - hash(block_a) != hash(block_b)
then:
  slash_amount = validator_stake / 32
  additional_penalty = min(
    validator_stake / 32,
    3 * sum_of_slashed_in_epoch / total_stake
  )
  total_penalty = slash_amount + additional_penalty
```

### Surround Vote Slashing

Triggered when attestation surrounds or is surrounded by prior attestation:

```
if attestation_a.source < attestation_b.source and
   attestation_a.target > attestation_b.target and
   attestation_a.slot != attestation_b.slot
then:
  slash_validator(attestation_a.validator)
  slash_validator(attestation_b.validator)
  penalty =