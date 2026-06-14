```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ProofOfIntelligence } from '../../src/consensus/ProofOfIntelligence';
import { Validator } from '../../src/types/Validator';
import { Block } from '../../src/types/Block';
import { IntelligenceChallenge } from '../../src/types/IntelligenceChallenge';
import { ValidationResult } from '../../src/types/ValidationResult';

describe('ProofOfIntelligence Consensus', () => {
  let poi: ProofOfIntelligence;
  let validators: Validator[];
  let mockBlock: Block;
  let mockChallenge: IntelligenceChallenge;

  beforeEach(() => {
    poi = new ProofOfIntelligence({
      minValidators: 3,
      quorumPercentage: 66,
      roundTimeout: 5000,
      slashingPercentage: 10,
      challengeDifficulty: 5,
    });

    validators = [
      {
        id: 'validator-1',
        address: '0x1234567890123456789012345678901234567890',
        stake: 1000,
        isActive: true,
        joinedAt: Date.now(),
        reputation: 95,
      },
      {
        id: 'validator-2',
        address: '0x0987654321098765432109876543210987654321',
        stake: 1000,
        isActive: true,
        joinedAt: Date.now(),
        reputation: 90,
      },
      {
        id: 'validator-3',
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        stake: 1000,
        isActive: true,
        joinedAt: Date.now(),
        reputation: 88,
      },
      {
        id: 'validator-4',
        address: '0xfedcbafedcbafedcbafedcbafedcbafedcbafedcba',
        stake: 1000,
        isActive: true,
        joinedAt: Date.now(),
        reputation: 92,
      },
    ];

    validators.forEach((v) => poi.registerValidator(v));

    mockBlock = {
      height: 1,
      hash: '0xabcd1234',
      parentHash: '0x0000000000000000000000000000000000000000',
      timestamp: Date.now(),
      proposer: 'validator-1',
      transactions: [],
      merkleRoot: '0x5678efgh',
      nonce: 12345,
      difficulty: 5,
    };

    mockChallenge = {
      id: 'challenge-001',
      type: 'mathematical',
      difficulty: 5,
      question: 'Solve: What is the SHA256 hash of "test"?',
      createdAt: Date.now(),
      expiresAt: Date.now() + 10000,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Round Progression', () => {
    it('should initialize a new round with proper state', () => {
      const round = poi.initializeRound(1, mockBlock);

      expect(round.roundNumber).toBe(1);
      expect(round.blockHash).toBe(mockBlock.hash);
      expect(round.status).toBe('active');
      expect(round.validatorsParticipating).toHaveLength(0);
      expect(round.votes).toEqual({});
    });

    it('should progress to next round when current round completes', () => {
      const round1 = poi.initializeRound(1, mockBlock);
      const block2: Block = { ...mockBlock, height: 2, hash: '0xefgh5678' };
      const round2 = poi.initializeRound(2, block2);

      expect(round2.roundNumber).toBe(2);
      expect(poi.getCurrentRound()).toBe(2);
      expect(round1.status).toBe('completed');
    });

    it('should track validator participation across rounds', () => {
      poi.initializeRound(1, mockBlock);
      poi.recordParticipation('validator-1');
      poi.recordParticipation('validator-2');

      const participationRecord = poi.getValidatorParticipation('validator-1');
      expect(participationRecord.totalRounds).toBe(1);
      expect(participationRecord.activeParticipation).toBe(1);
    });

    it('should handle round timeout correctly', (done) => {
      const round = poi.initializeRound(1, mockBlock);
      expect(round.status).toBe('active');

      setTimeout(() => {
        const timedOutRound = poi.checkRoundTimeout();
        if (timedOutRound) {
          expect(timedOutRound.status).toBe('timeout');
          done();
        }
      }, 5100);
    });

    it('should increment round number sequentially', () => {
      for (let i = 1; i <= 5; i++) {
        const block = { ...mockBlock, height: i, hash: `0xhash${i}` };
        poi.initializeRound(i, block);
        expect(poi.getCurrentRound()).toBe(i);
      }
    });
  });

  describe('Quorum Handling', () => {
    it('should fail consensus when quorum is not met', () => {
      poi.initializeRound(1, mockBlock);

      // Only 1 validator out of 4 votes (need 3 for 66% quorum)
      poi.recordVote('validator-1', mockBlock.hash, true);

      const consensusResult = poi.checkConsensus(mockBlock);
      expect(consensusResult.consensusReached).toBe(false);
      expect(consensusResult.reason).toBe('quorum_not_met');
    });

    it('should succeed consensus when quorum is met with approval', () => {
      poi.initializeRound(1, mockBlock);

      // 3 out of 4 validators vote (75% > 66% quorum)
      poi.recordVote('validator-1', mockBlock.hash, true);
      poi.recordVote('validator-2', mockBlock.hash, true);
      poi.recordVote('validator-3', mockBlock.hash, true);

      const consensusResult = poi.checkConsensus(mockBlock);
      expect(consensusResult.consensusReached).toBe(true);
      expect(consensusResult.reason).toBe('quorum_met');
    });

    it('should fail consensus when majority rejects block', () => {
      poi.initializeRound(1, mockBlock);

      poi.recordVote('validator-1', mockBlock.hash, false);
      poi.recordVote('validator-2', mockBlock.hash, false);
      poi.recordVote('validator-3', mockBlock.hash, true);

      const consensusResult = poi.checkConsensus(mockBlock);
      expect(consensusResult.consensusReached).toBe(false);
      expect(consensusResult.reason).toBe('majority_rejection');
    });

    it('should calculate quorum percentage correctly', () => {
      poi.initializeRound(1, mockBlock);

      poi.recordVote('validator-1', mockBlock.hash, true);
      poi.recordVote('validator-2', mockBlock.hash, true);
      poi.recordVote('validator-3', mockBlock.hash, true);
      poi.recordVote('validator-4', mockBlock.hash, false);

      const quorumStats = poi.getQuorumStats(mockBlock);
      expect(quorumStats.totalVotes).toBe(4);
      expect(quorumStats.approvalPercentage).toBe(75);
      expect(quorumStats.participationPercentage).toBe(100);
    });

    it('should handle minimum validator requirements', () => {
      const smallPoi = new ProofOfIntelligence({