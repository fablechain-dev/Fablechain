# Fablechain Proof-of-Intelligence Consensus

## Executive Summary

Fablechain implements Proof-of-Intelligence (PoI), a novel consensus mechanism that combines stake-weighted voting with intelligence-based validator differentiation. Unlike traditional Proof-of-Stake (PoS) systems that treat all validators equally after collateralization, PoI dynamically adjusts validator influence based on demonstrated consensus quality, historical participation, and computational contribution metrics.

## Protocol Overview

### Core Principles

1. **Intelligence Scoring**: Validators earn reputation through consistent block proposal quality and voting accuracy
2. **Adaptive Weighting**: Voting power scales with intelligence score, not just stake
3. **Economic Security**: Slashing punishes both malicious behavior and incompetence
4. **Fair Distribution**: New validators can quickly establish credibility through honest participation

### Consensus Parameters

```
EPOCH_LENGTH = 32 blocks
ROUND_DURATION = 12 seconds
FINALITY_DELAY = 2 epochs (64 blocks)
MIN_STAKE = 32 ETH equivalent
MAX_VALIDATORS = 1024
INTELLIGENCE_DECAY = 0.995 per epoch
BASE_REWARD_RATE = 4% APY
```

## Round Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    CONSENSUS ROUND (12s)                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  PHASE 1: PROPOSAL (2s)                                 │
│  ├─ Slot leader selected via weighted VRF              │
│  ├─ Block proposed with beacon data                    │
│  ├─ Intelligence audit begins                          │
│  └─ Propagates to network                              │
│                                                          │
│  PHASE 2: ATTESTATION (4s)                             │
│  ├─ Committee validators sample block                  │
│  ├─ Vote weighted by intelligence score                │
│  ├─ Votes aggregated into certificate                  │
│  └─ 2/3 supermajority threshold                        │
│                                                          │
│  PHASE 3: FINALIZATION (6s)                            │
│  ├─ Previous epoch blocks confirmed                    │
│  ├─ Slashing conditions evaluated                      │
│  ├─ Intelligence scores updated                        │
│  └─ State root committed                               │
│                                                          │
└─────────────────────────────────────────────────────────┘

32 rounds per epoch:
├─ 0-31s: Block production and attestation
├─ 32-64s: Validator shuffling
└─ 64+: State transitions and rewards/penalties
```

## Validator Duties

### Proposal Duty

Slot leaders must produce valid blocks within their assigned slot:

```
PROPOSAL_DUTY {
  slot_leader = selectProposer(epoch, slot, intelligence_scores)
  
  must_include {
    - parent_block_hash (previous justified block)
    - beacon_state_root
    - signatures from ≥2/3 of active validators
    - transactions ordered by priority fee
    - attestations from prior slot
  }
  
  validation_checks {
    - parent exists and is canonical
    - state_root matches computation
    - signatures valid (BLS12-381)
    - no double-signing
    - ≤16MB block size
    - execution time ≤2s
  }
  
  penalties {
    - missed_proposal: -0.5% of stake per epoch
    - invalid_block: -2% of stake + removal
  }
}
```

### Attestation Duty

Committee members vote on proposed blocks weighted by intelligence:

```
ATTESTATION_DUTY {
  committee_size = 128
  committee_members = selectCommittee(epoch, shard, validators)
  
  attestation_weight[validator] = 
    base_stake[validator] * (1 + intelligence_score[validator] / 1000)
  
  must_attest {
    - source_checkpoint (previous justified epoch)
    - target_checkpoint (current epoch)
    - beacon_block_root (head block)
    - shard_head_root (proposed block)
  }
  
  aggregation {
    - BLS signature aggregation
    - deduplicate identical votes
    - verify ≥2/3 weight threshold
    - include in next block
  }
  
  penalties {
    - missed_attestation: -0.25% per epoch
    - conflicting_vote: -32% of stake + removal
    - late_attestation: -0.1% per slot delay
  }
}
```

## Intelligence Scoring System

### Score Calculation

Intelligence scores measure validator quality across multiple dimensions:

```
intelligence_score[v, epoch] = 
  α·proposal_quality[v, epoch] +
  β·attestation_accuracy[v, epoch] +
  γ·participation_rate[v, epoch] +
  δ·network_reliability[v, epoch]

where α=0.35, β=0.35, γ=0.20, δ=0.10

proposal_quality measures:
  - execution_success_rate (0-100 blocks analyzed)
  - block_propagation_latency (mean < 200ms)
  - transaction_ordering_quality (MEV minimization)
  - uncle_rate (blocks building on canonical chain)

attestation_accuracy measures:
  - correct_source_votes / total_votes
  - correct_target_votes / total_votes
  - voting_latency (within slot duration)
  - presence_in_aggregation

participation_rate = 
  epochs_participated / (current_epoch - entry_epoch)

network_reliability = 
  (1 - slashing_incidents / proposal_count) * 
  (1 - failed_validations / attestation_count)
```

### Score Evolution

```
EPOCH_TRANSITION {
  // Calculate raw score for new epoch
  raw_score = calculate_raw_score(validator, epoch)
  
  // Apply exponential moving average with decay
  historical_score = score[validator][epoch-1] * 0.995
  new_score = 0.3 * historical_score + 0.7 * raw_score
  
  // Bound between -100 and 1000
  score[validator][epoch] = clamp(new_score, -100, 1000)
  
  // Boost for new validators (onboarding gradient)
  if epochs_participated[validator] < 8 {
    score[validator][epoch] *= (1 + 0.05 * (8 - epochs_participated[validator]))
  }
  
  // Penalty for inactivity
  if missed_slots[validator][epoch] > 8 {
    score[validator][epoch] -= missed_slots[validator][epoch] * 5
  }
}
```

## Slashing Conditions

### Slashable Offenses

```
SLASHABLE_OFFENSE {
  
  DOUBLE_PROPOSAL: severity=CRITICAL (100% slash)
    - Same validator proposes 2+ blocks in single slot
    - Detection: compare proposal_index across blocks
    - Action: immediate removal + full stake confiscation
  
  CONFLICTING_ATTESTATION: severity=CRITICAL (100% slash)
    - Validator attests to conflicting source/target
    - Detection: (source1 ≠ source2) OR (target1 ≠ target2)
    - Action: slashing + 18-epoch jail period
    - Correlation reward: reporters earn 5% of slashed stake
  
  SURROUND_VOTE: severity=CRITICAL (100% slash)
    - Attestation_n.source < attestation_m.source < 
      attestation_m.target < attestation_n.target
    - Indicates attempt to revert finalized state
    - Action: slashing + removal + investigation
  
  INVALID_PROPOSAL: severity=HIGH (32% slash)
    - Block fails state transition
    - Invalid signatures detected
    - Merkle proof verification fails
    - Action: 32% penalty + proposal duty suspension
  
  LATE_ATTESTATION: severity=LOW (0.25% slash per slot)
    - Attestation included >12 slots after target
    - Indicates network isolation or incompetence