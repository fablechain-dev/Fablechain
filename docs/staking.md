# FABLE Staking Guide

## Overview

FABLE staking is the core mechanism for network security and validator participation in the Fablechain consensus protocol. By staking FABLE tokens, participants can become validators, earn rewards, and contribute to network consensus through Proof-of-Stake (PoS).

## Getting Started with Staking

### Minimum Stake Requirements

- **Minimum stake per validator**: 32 FABLE tokens
- **Maximum stake per validator**: 10,000 FABLE tokens
- **Recommended stake**: 100+ FABLE tokens for optimal rewards

### How to Stake

1. **Install Fable CLI or Web Wallet**
   ```
   Visit https://fablechain.io/wallet or install fable-cli
   ```

2. **Create or Import Validator Account**
   - Generate new keypair or import existing private key
   - Ensure account has sufficient FABLE tokens plus gas fees

3. **Submit Staking Transaction**
   - Navigate to Staking dashboard
   - Enter stake amount between minimum and maximum
   - Review validator metadata (moniker, website, commission rate)
   - Approve transaction and confirm on-chain

4. **Become Active**
   - Stake becomes active after 1 consensus epoch (~12 hours)
   - Validator begins earning rewards immediately upon activation

## Unbonding Period

Staked tokens are illiquid during active validation. To withdraw:

1. **Initiate Unbond**
   - Call `unbond()` transaction on your validator
   - Tokens immediately stop earning rewards
   - Validator removed from active set

2. **Waiting Period**
   - **Duration**: 21 days (504 epochs)
   - **Purpose**: Security measure against validator attacks
   - Cannot re-stake during unbonding period

3. **Claim Unbonded Tokens**
   - After 21 days, call `claim_unbond()` to receive tokens
   - Tokens return to liquid balance

## Rewards Calculation

### Annual Reward Rate

The FABLE network uses an algorithmic reward schedule:

```
Base APR = 12% (Year 1-2)
Base APR = 8% (Year 3-4)
Base APR = 5% (Year 5+)
```

### Individual Validator Rewards

```
Validator Reward = (Stake / Total Staked) × Annual Reward
Commission Deduction = Validator Reward × Commission Rate
Delegator Reward = Validator Reward - Commission Deduction
```

**Example**: 100 FABLE staked, 20% network participation, 10% commission
- Annual base: 100 × (12% ÷ 0.20) = 600 FABLE
- Commission taken: 600 × 10% = 60 FABLE
- Net reward: 540 FABLE (~5.4% effective APR after commission)

### Reward Distribution

- Rewards credited daily to validator balance
- Automatic reinvestment available (compound staking)
- Manual claim required for delegated stakes

## Slashing Risks

Validators face penalties for protocol violations:

### Slashing Events

| Violation | Penalty | Recovery |
|-----------|---------|----------|
| Double-signing (signing same block twice) | 5% of stake | Permanent |
| Downtime (>50% epochs offline) | 1% of stake | Jail for 7 days |
| Attempted stake increase during unbond | 2% of stake | Jail for 3 days |

### Slashing Mechanics

- Penalties applied immediately when detected
- Jailed validators cannot propose blocks
- Automatic unjail after jail period expires
- Slashed amounts burned (removed from circulation)

## Delegation

### What is Delegation?

Delegation allows token holders to delegate stake to professional validators without running infrastructure.

### How to Delegate

1. **Select Validator**
   - Review commission rates (0-100%)
   - Check uptime history (target: >99%)
   - Verify validator identity and reputation

2. **Submit Delegation**
   - Amount can be any value (no minimum)
   - Rewards accrue after 1 epoch
   - Commission automatically deducted from rewards

3. **Redelegate or Undelegate**
   - Switch validators instantly (no unbonding)
   - Unbond delegated stake for 21-day period
   - Rewards remain at validator until claimed

### Commission Structure

Validators set commission rates (0-100%):
- **Low commission** (5-15%): Attracts more delegation
- **High commission** (30%+): Targets institutional stakes
- **Variable commission**: Some validators adjust based on performance

## Best Practices

- **Diversify delegations** across 3-5 validators to reduce risk
- **Monitor validator performance** weekly via on-chain analytics
- **Keep rewards compounded** for exponential growth
- **Plan unbonding timeline** - allow 3 weeks minimum for liquidity needs
- **Use hardware wallet** for validator keys (Ledger, Trezor support available)

## Security Considerations

- Never share private validator keys
- Use separate accounts for operations and rewards
- Enable 2FA on web wallet interfaces
- Verify validator addresses via official DNS records

For technical documentation, see [validator-setup.md](./validator-setup.md)