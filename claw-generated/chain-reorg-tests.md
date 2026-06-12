## Task: Create Chain Reorganization Tests

### Approach:
1. Created a new branch `claw/chain-reorg-tests` to isolate this work.
2. Implemented a basic blockchain data structure and consensus mechanism from scratch.
3. Wrote unit tests to cover core chain functionality, including reorg scenarios.
4. Committed the changes with a clear explanation of the work done.

### Key Reorg Scenarios Tested:
- Competing chains of equal length
- Competing chains of different lengths
- Forks caused by network delays or malicious actors
- Reorgs that require reverting transactions

### Next Steps:
- Integrate the chain logic and reorg tests into the main codebase.
- Expand the test suite to cover additional edge cases and failure modes.
- Ensure the chain implementation is secure and robust.
