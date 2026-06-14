# FABLE Staking Guide

## Overview

Staking is the process of locking FABLE tokens in the network to participate in consensus and earn rewards. Stakers secure the Fablechain network and receive proportional rewards based on their stake and validator performance.

## How to Stake

### Prerequisites

- Minimum stake: 1,000 FABLE tokens
- Active validator node running Fablechain software
- Sufficient gas fees (paid in FABLE)

### Staking Process

1. **Prepare Your Validator**
   - Download and install Fablechain node software
   - Configure validator identity and commission rates
   - Ensure your node is fully synchronized

2. **Submit Staking Transaction**
   ```bash
   fabled tx staking create-validator \
     --amount=1000000000ufable \
     --pubkey=$(fabled tendermint show-validator) \
     --moniker="MyValidator" \
     --chain-id=fablechain-1 \
     --commission-rate=0.10 \
     --commission-max-rate=0.20 \
     --commission-max-change-rate=0.01 \
     --min-self-delegation=1000000000ufable
   ```

3. **Delegate Tokens**
   - Token holders can delegate to validators without running infrastructure
   - Delegation command: `fabled tx staking delegate [validator-address] [amount]`

## Unbonding Period

The unbonding period ensures network security by preventing rapid stake withdrawal during attacks or slashing events.

- **Standard unbonding duration: 21 days**
- Tokens remain locked during this period
- No rewards are earned on unbonding tokens
- Unbonding can be initiated at any time but must complete the full period
- Multiple unbonding transactions are tracked separately

### Unbonding Transaction

```bash
fabled tx staking unbond [validator-address] [amount] \
  --chain-id=fablechain-1 \
  --from=[your-address]
```

## Rewards Calculation

Staking rewards are distributed from inflation and transaction fees, calculated dynamically based on network conditions.

### Reward Formula

```
Annual Reward = (Stake Amount × Annual Inflation Rate) / Total Network Stake
```

### Key Variables

- **Annual inflation rate**: 7-20% (adjusted based on bonded ratio)
- **Target bonding ratio**: 66.7% of total supply
- **Commission**: Validators earn 5-20% of delegator rewards
- **Reward distribution**: Every block (approximately 6 seconds)

### Example Calculation

- Network stake: 100M FABLE
- Your stake: 100,000 FABLE (0.1%)
- Annual inflation: 10%
- Total annual rewards: 10M FABLE
- Your share: 10,000 FABLE (0.1% of 10M)
- Validator commission: 10% → You receive 9,000 FABLE

## Slashing Risks

Validators face penalties for protocol violations or downtime, protecting network integrity.

### Slashing Conditions

**Downtime Slashing**
- Triggered: Missing >50% of blocks in 10,000-block window
- Penalty: 0.01% of stake
- Recovery possible: Re-enable validator to regain eligibility

**Double-signing Slashing**
- Triggered: Signing conflicting blocks
- Penalty: 5% of stake
- Consequence: Permanent jailing, validator must be unjailed manually

**Byzantine Violation**
- Triggered: Consensus violations
- Penalty: Up to 20% of stake
- Risk level: Critical

## Delegation Strategy

### Best Practices

1. **Diversify across validators** to reduce single-point-of-failure risk
2. **Monitor validator performance** - check uptime, commission rates, and voting participation
3. **Review commission changes** - validators can adjust rates (maximum change: 1% per day)
4. **Participate in governance** - delegate your voting power to trusted addresses
5. **Track unbonding periods** - plan liquidity needs carefully

### Validator Selection Criteria

- **Uptime**: Target >99%
- **Commission**: 5-15% is competitive
- **Self-delegation**: Higher self-delegation indicates validator confidence
- **Community reputation**: Check governance participation and security history
- **Hardware quality**: Ensure reliable infrastructure

## Security Recommendations

- Use hardware wallets for validator signing keys
- Maintain offline backup of validator private keys
- Enable two-factor authentication on exchange accounts
- Monitor validator metrics via dashboard
- Join validator communities for updates and support
- Implement automated alerting for downtime/slashing events

## Resources

- Staking dashboard: https://staking.fablechain.io
- Validator registry: https://validators.fablechain.io
- Community forum: https://community.fablechain.io
- Technical documentation: https://docs.fablechain.io