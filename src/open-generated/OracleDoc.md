# Oracle System

The Oracle contract in OpenChain allows external data to be securely brought on-chain using a commit-reveal mechanism.

## Key Features
- Data providers can request to submit data by committing a hash of the data and specifying a reward and reveal deadline.
- Data providers can later reveal the actual data and a proof that it matches the committed hash.
- The Oracle contract verifies the data and proof, and transfers the reward to the data provider.
- Multiple data sources can be supported, with the Oracle contract handling requests from different providers.
- The system incentivizes honest behavior by rewarding accurate data and penalizing dishonest actors.

## Usage
1. Data provider calls `requestData()` with a hash of the data, a reward amount, and a reveal deadline.
2. Data provider later calls `revealData()` with the actual data and a proof that it matches the committed hash.
3. The Oracle contract verifies the data and proof, and transfers the reward to the data provider.

## Future Improvements
- Implement a slashing mechanism to penalize dishonest oracles.
- Add support for multiple reward tokens (not just ERC20).
- Explore ways to make the proof verification more efficient.