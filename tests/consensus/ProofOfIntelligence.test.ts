```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProofOfIntelligence } from '../../src/consensus/ProofOfIntelligence';
import { ValidatorRegistry } from '../../src/validators/ValidatorRegistry';
import { SlashingPool } from '../../src/penalties/SlashingPool';
import { IntelligenceChallenge } from '../../src/challenges/IntelligenceChallenge';
import { ConsensusState, ValidatorState, RoundState } from '../../src/types/consensus';
import { ValidationError, QuorumError, SlashingError } from '../../src/errors';

describe('ProofOfIntelligence Consensus', () => {
  let poi: ProofOfIntelligence;
  let validatorRegistry: ValidatorRegistry;
  let slashingPool: SlashingPool;
  let challengeEngine: IntelligenceChallenge;

  const mockValidators = [
    { id: 'val1', stake: 1000, reputation: 95, active: true, slashable: true },
    { id: 'val2', stake: 800, reputation: 88, active: true, slashable: true },
    { id: 'val3', stake: 600, reputation: 75, active: true, slashable: true },
    { id: 'val4', stake: 500, reputation: 60, active: true, slashable: true },
  ];

  beforeEach(() => {
    validatorRegistry = new ValidatorRegistry();
    slashingPool = new SlashingPool();
    challengeEngine = new IntelligenceChallenge();

    poi = new ProofOfIntelligence({
      validatorRegistry,
      slashingPool,
      challengeEngine,
      quorumThreshold: 0.66,
      maxRoundTime: 60000,
      minValidators: 3,
      slashingPercentage: 0.1,
      reputationDecay: 0.95,
    });

    mockValidators.forEach((v) => {
      validatorRegistry.register(v.id, {
        stake: v.stake,
        reputation: v.reputation,
        active: v.active,
        address: `0x${v.id}`,
        joinedAt: Date.now(),
        slashable: v.slashable,
        consecutiveFailures: 0,
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Round Progression', () => {
    it('should initialize round 0 with valid state', async () => {
      const state = poi.getCurrentRoundState();

      expect(state.round).toBe(0);
      expect(state.phase).toBe('proposal');
      expect(state.validators.length).toBe(4);
      expect(state.startTime).toBeGreaterThan(0);
      expect(state.proposer).toBeDefined();
    });

    it('should progress from proposal to commitment phase', async () => {
      const initialPhase = poi.getCurrentRoundState().phase;
      expect(initialPhase).toBe('proposal');

      await poi.advancePhase();
      const nextPhase = poi.getCurrentRoundState().phase;

      expect(nextPhase).toBe('commitment');
      expect(nextPhase).not.toBe(initialPhase);
    });

    it('should progress through all phases sequentially', async () => {
      const phases = ['proposal', 'commitment', 'reveal', 'finalization'];
      let currentIndex = 0;

      for (let i = 0; i < phases.length - 1; i++) {
        expect(poi.getCurrentRoundState().phase).toBe(phases[currentIndex]);
        await poi.advancePhase();
        currentIndex++;
      }

      expect(poi.getCurrentRoundState().phase).toBe('finalization');
    });

    it('should increment round number on finalization', async () => {
      const initialRound = poi.getCurrentRoundState().round;

      await poi.advancePhase();
      await poi.advancePhase();
      await poi.advancePhase();
      await poi.finalizeRound();

      const finalRound = poi.getCurrentRoundState().round;
      expect(finalRound).toBe(initialRound + 1);
    });

    it('should rotate proposer selection across rounds', async () => {
      const round0Proposer = poi.getCurrentRoundState().proposer;

      await poi.finalizeRound();
      const round1Proposer = poi.getCurrentRoundState().proposer;

      await poi.finalizeRound();
      const round2Proposer = poi.getCurrentRoundState().proposer;

      expect(round0Proposer).not.toBe(round1Proposer);
      expect(round1Proposer).not.toBe(round2Proposer);
    });

    it('should track timestamp progression during round', async () => {
      const startTime = poi.getCurrentRoundState().startTime;

      await new Promise((resolve) => setTimeout(resolve, 100));
      await poi.advancePhase();

      const updatedState = poi.getCurrentRoundState();
      expect(updatedState.phaseStartTime).toBeGreaterThan(startTime);
    });

    it('should handle rapid phase transitions', async () => {
      const promises = Array(4)
        .fill(null)
        .map(() => poi.advancePhase());

      await Promise.all(promises);

      const finalPhase = poi.getCurrentRoundState().phase;
      expect(finalPhase).toBeDefined();
    });
  });

  describe('Quorum Failure Handling', () => {
    it('should detect quorum failure when validators below threshold', async () => {
      const activeValidators = validatorRegistry.getActiveValidators();
      const requiredQuorum = Math.ceil(activeValidators.length * 0.66);
      const failingCount = activeValidators.length - Math.floor(requiredQuorum / 2);

      for (let i = 0; i < failingCount; i++) {
        validatorRegistry.setValidatorStatus(activeValidators[i].id, false);
      }

      const hasQuorum = poi.hasQuorum();
      expect(hasQuorum).toBe(false);
    });

    it('should throw QuorumError when attempting consensus without quorum', async () => {
      const activeValidators = validatorRegistry.getActiveValidators();

      for (let i = 0; i < activeValidators.length - 1; i++) {
        validatorRegistry.setValidatorStatus(activeValidators[i].id, false);
      }

      await expect(poi.proposeBlock({ data: 'test' })).rejects.toThrow(QuorumError);
    });

    it('should calculate quorum threshold based on stake weight', async () => {
      const totalStake = mockValidators.reduce((sum, v) => sum + v.stake, 0);
      const quorumThreshold = Math.ceil(totalStake * 0.66);

      const validators = validatorRegistry.getActiveValidators();
      const stakeSums = validators.reduce((sum, v) => sum + v.stake, 0);

      expect(stakeSums).toBe(totalStake);
      expect(poi.getRequiredQuorumStake()).toBe(quorumThreshold);
    });

    it('should recover consensus when validators rejoin', async () => {
      const activeValidators = validatorRegistry.getActiveValidators();

      for (let i = 0; i < activeValidators.length - 1; i++) {
        validatorRegistry.setValidatorStatus(activeValidators[i].id, false);
      }

      expect(poi.hasQuorum()).toBe(false);

      validatorRegistry.setValidatorStatus(activeValidators[0].id, true);
      expect(poi.hasQuorum()).toBe(true);
    });

    it('should apply timeout penalties to quorum-failing validators', async () => {
      const activeValidators = validatorRegistry.getActiveValidators();
      const validator = activeValidators[0];

      validatorRegistry.setValidatorStatus(validator.id, false);

      await poi.ap