# Fablechain Cross-Chain Bridge Documentation

## Overview

The Fablechain Cross-Chain Bridge enables secure, trustless asset transfers between Fablechain and supported external blockchains. The bridge uses a lock-and-mint architecture with cryptographic fraud proofs to ensure security across heterogeneous consensus mechanisms.

## Supported Chains

### Primary Integrations

| Chain | Network | Token Standard | Status |
|-------|---------|---|---|
| Ethereum | Mainnet | ERC-20 | Production |
| Polygon | Mainnet | ERC-20 | Production |
| Arbitrum One | Mainnet | ERC-20 | Production |
| Optimism | Mainnet | ERC-20 | Production |
| Base | Mainnet | ERC-20 | Production |
| Avalanche C-Chain | Mainnet | ERC-20 | Staging |

### Minimum Requirements

Each integrated chain must satisfy:

- **Finality Threshold**: Minimum 30 block confirmations before bridge acceptance
- **RPC Availability**: 99.9% uptime SLA across primary and backup nodes
- **Validator Set**: Minimum 50 independent validator operators
- **Block Time Stability**: Variance < 50% from published target

## Lock/Unlock Flow

### Deposit (External → Fablechain)

1. **User Initiation**
   - User approves ERC-20 token to Bridge contract
   - Calls `lock(amount, destinationAddress)` on external chain
   - Event `TokensLocked(tokenAddress, amount, recipient, nonce)` emitted

2. **Confirmation Phase**
   - Bridge monitors external chain for finality (30 blocks)
   - Validator set independently verifies transaction inclusion
   - Majority (>66% stake-weighted) signs attestation
   - Attestation published to Fablechain within 5-minute window

3. **Minting Phase**
   - Fablechain relayer submits attestation to Bridge contract
   - Bridge contract verifies validator signatures
   - Wrapped tokens minted to recipient address
   - Event `TokensMinted(wrappedTokenAddress, amount, recipient)` emitted

### Withdrawal (Fablechain → External)

1. **Burn Initiation**
   - User calls `burn(wrappedTokenAddress, amount, targetAddress)` on Fablechain
   - Atomic swap: wrapped tokens burned, burn proof generated
   - Event `TokensBurned(wrappedTokenAddress, amount, targetChain, recipient)` emitted

2. **Proof Generation**
   - Fablechain validators create fraud-proof-resistant exit proof
   - Merkle proof of burn included in proof
   - Proof signed by validator quorum (>66% stake)
   - Root commitment anchored to external chain bridge contract

3. **Claim and Unlock**
   - User submits proof + signatures to external chain bridge
   - Bridge contract verifies proof against Fablechain root
   - Bridge contract verifies validator signatures
   - Locked tokens transferred to recipient address
   - Event `TokensUnlocked(tokenAddress, amount, recipient)` emitted

## Fraud Proof Window

### Dispute Period

- **Duration**: 7 days (604,800 blocks on Fablechain)
- **Purpose**: Allow observers to challenge potentially fraudulent attestations
- **Activation**: Begins when attestation first published to Fablechain

### Fraud Proof Mechanism

```
Fraud Challenge Process:
1. Challenger submits cryptographic proof of attestation invalidity
2. Proof demonstrates:
   - Validator signature forgery, OR
   - Transaction non-inclusion in external chain, OR
   - Invalid state transition
3. Fablechain verifies proof through optimistic verification
4. If valid, challenged attestation is reverted
5. Malicious validators' stakes slashed (33% penalty)
6. Challenger receives 10% of slashed stake as reward
```

### Slashing Conditions

- **Equivocation**: Signing conflicting attestations → 33% slash
- **Non-Availability**: Missing required attestation → 5% slash after 24 hours
- **Invalid Proof**: Submitting fraudulent fraud-proof → 66% slash

## Security Assumptions

### Cryptographic Assumptions

- **ECDSA Security**: 256-bit ECDSA provides 128-bit symmetric strength
- **Merkle Trees**: SHA-256 collision resistance used for state proofs
- **Hash Functions**: Keccak-256 standard across all chains

### Consensus Assumptions

- **Honest Majority**: >66% of validator stake behaves honestly
- **Economic Security**: Validator slashing penalty (>$1M per validator) exceeds potential fraud gains
- **Independent Operations**: Validator set diversity prevents coordinated attacks
  - No single operator controls >15% of stake
  - Geographic distribution across ≥6 continents
  - Infrastructure diversity (no >30% on single cloud provider)

### External Chain Assumptions

- **Finality**: 30-block confirmation threshold corresponds to <0.1% reorg probability
- **RPC Accuracy**: Bridge monitors ≥3 independent RPC endpoints with majority voting
- **No Reorg Risk**: Ethereum/Polygon have proven 99.99%+ finality after 30 blocks

### Operational Assumptions

- **Validator Liveness**: ≥95% of validators submit attestations within 5 minutes
- **Bridge Contract Correctness**: Smart contracts audited by 3+ independent firms
- **Key Management**: Validator keys held in HSM or hardware wallets with multi-sig controls

## Economic Parameters

| Parameter | Value | Justification |
|-----------|-------|---|
| Minimum Validator Stake | 100,000 FABLE | $1M+ in security deposit |
| Attestation Reward | 0.01% of volume | Incentivizes participation |
| Challenge Bond | 1 FABLE | Prevents spam challenges |
| Fraud Proof Reward | 10% of slash | Compensates verifiers |

## Monitoring and Alerts

Bridge operators must maintain continuous monitoring for:

- **Validator Equivocation**: Alert if validator signs conflicting attestations
- **Finality Delays**: Alert if external chain has >50 block reorg
- **Signature Verification Failures**: Alert on >1% invalid signature rate
- **RPC Divergence**: Alert if RPC endpoints report conflicting blocks

## Emergency Procedures

The bridge includes a circuit-breaker mechanism:

- **Automatic Halt**: Triggers if validator participation drops below 50%
- **Manual Pause**: Multisig emergency council can pause bridge operations
- **Recovery Window**: 48-hour pause for investigation and mitigation