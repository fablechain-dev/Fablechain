```typescript
import { InferenceNotarizer } from '../../src/ai/InferenceNotarizer';
import { InferenceResult, NotarizationProof, DeterminismReport } from '../../src/ai/types';
import crypto from 'crypto';

describe('InferenceNotarizer', () => {
  let notarizer: InferenceNotarizer;

  beforeEach(() => {
    notarizer = new InferenceNotarizer();
  });

  describe('Determinism Verification', () => {
    it('should produce identical hashes for identical inference inputs across multiple runs', async () => {
      const inferenceInput: InferenceResult = {
        modelId: 'gpt-4-turbo',
        modelVersion: '2024-01-15',
        prompt: 'What is the capital of France?',
        response: 'The capital of France is Paris.',
        timestamp: 1704067200000,
        temperature: 0.7,
        maxTokens: 256,
        seed: 42,
        processingTimeMs: 145,
        inputTokens: 12,
        outputTokens: 8,
        metadata: {
          userId: 'user-123',
          sessionId: 'session-456',
          requestId: 'req-789',
        },
      };

      const proofs: string[] = [];

      for (let i = 0; i < 5; i++) {
        const proof = await notarizer.notarizeInference(inferenceInput);
        proofs.push(proof.hash);
      }

      const firstHash = proofs[0];
      proofs.forEach((hash, index) => {
        expect(hash).toBe(firstHash);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      });
    });

    it('should produce different hashes when any input parameter changes', async () => {
      const baseInput: InferenceResult = {
        modelId: 'gpt-4-turbo',
        modelVersion: '2024-01-15',
        prompt: 'What is the capital of France?',
        response: 'The capital of France is Paris.',
        timestamp: 1704067200000,
        temperature: 0.7,
        maxTokens: 256,
        seed: 42,
        processingTimeMs: 145,
        inputTokens: 12,
        outputTokens: 8,
        metadata: {
          userId: 'user-123',
          sessionId: 'session-456',
          requestId: 'req-789',
        },
      };

      const baseProof = await notarizer.notarizeInference(baseInput);

      const modifiedPrompt = { ...baseInput, prompt: 'What is the capital of Germany?' };
      const proofDifferentPrompt = await notarizer.notarizeInference(modifiedPrompt);
      expect(proofDifferentPrompt.hash).not.toBe(baseProof.hash);

      const modifiedResponse = { ...baseInput, response: 'Paris is the capital of France.' };
      const proofDifferentResponse = await notarizer.notarizeInference(modifiedResponse);
      expect(proofDifferentResponse.hash).not.toBe(baseProof.hash);

      const modifiedTemperature = { ...baseInput, temperature: 0.9 };
      const proofDifferentTemp = await notarizer.notarizeInference(modifiedTemperature);
      expect(proofDifferentTemp.hash).not.toBe(baseProof.hash);

      const modifiedTimestamp = { ...baseInput, timestamp: 1704067300000 };
      const proofDifferentTime = await notarizer.notarizeInference(modifiedTimestamp);
      expect(proofDifferentTime.hash).not.toBe(baseProof.hash);
    });

    it('should maintain determinism with deep nested metadata changes', async () => {
      const input1: InferenceResult = {
        modelId: 'claude-3-opus',
        modelVersion: '2024-02-01',
        prompt: 'Explain quantum computing',
        response: 'Quantum computing uses quantum bits...',
        timestamp: 1704153600000,
        temperature: 0.5,
        maxTokens: 512,
        seed: 123,
        processingTimeMs: 234,
        inputTokens: 20,
        outputTokens: 45,
        metadata: {
          userId: 'user-xyz',
          sessionId: 'sess-abc',
          requestId: 'req-def',
          context: {
            language: 'en-US',
            apiVersion: 'v2',
            customField: 'value1',
          },
        },
      };

      const input2: InferenceResult = {
        ...input1,
        metadata: {
          ...input1.metadata,
          context: {
            language: 'en-US',
            apiVersion: 'v2',
            customField: 'value1',
          },
        },
      };

      const proof1 = await notarizer.notarizeInference(input1);
      const proof2 = await notarizer.notarizeInference(input2);

      expect(proof1.hash).toBe(proof2.hash);
    });

    it('should generate determinism report with statistics', async () => {
      const input: InferenceResult = {
        modelId: 'llama-2-70b',
        modelVersion: '2024-01-20',
        prompt: 'Test determinism',
        response: 'Response for determinism test',
        timestamp: 1704240000000,
        temperature: 0.3,
        maxTokens: 128,
        seed: 999,
        processingTimeMs: 87,
        inputTokens: 5,
        outputTokens: 6,
        metadata: {
          userId: 'determinism-tester',
          sessionId: 'det-session',
          requestId: 'det-request',
        },
      };

      const report = await notarizer.generateDeterminismReport(input, 10);

      expect(report.isConsistent).toBe(true);
      expect(report.totalRuns).toBe(10);
      expect(report.uniqueHashes).toBe(1);
      expect(report.hashes).toHaveLength(10);
      expect(new Set(report.hashes).size).toBe(1);
      expect(report.consistencyPercentage).toBe(100);
      expect(report.hashVariance).toBe(0);
    });
  });

  describe('Hash Uniqueness', () => {
    it('should generate unique hashes for different inference results', async () => {
      const inferences: InferenceResult[] = [
        {
          modelId: 'gpt-4-turbo',
          modelVersion: '2024-01-15',
          prompt: 'Prompt 1',
          response: 'Response 1',
          timestamp: 1704067200000,
          temperature: 0.7,
          maxTokens: 256,
          seed: 1,
          processingTimeMs: 100,
          inputTokens: 10,
          outputTokens: 5,
          metadata: { userId: 'user1', sessionId: 'sess1', requestId: 'req1' },
        },
        {
          modelId: 'gpt-4-turbo',
          modelVersion: '2024-01-15',
          prompt: 'Prompt 2',
          response: 'Response 2',
          timestamp: 1704067300000,
          temperature: 0.7,
          maxTokens: 256,
          seed: 2,
          processingTimeMs: 101,
          inputTokens: 11,
          outputTokens: 6,
          metadata: { userId: 'user2', sessionId: 'sess2', requestId: 'req2' },
        },
        {
          modelId: 'gpt-4-turbo',
          modelVersion: '2024-01-15',
          prompt: 'Prompt 3',
          response: 'Response 3',
          timestamp