```typescript
import { InferenceNotarizer } from '../../src/ai/InferenceNotarizer';
import { createHash } from 'crypto';

interface TestInferenceRecord {
  modelId: string;
  input: string;
  output: string;
  timestamp: number;
  parameters: Record<string, unknown>;
}

interface NotarizationProof {
  hash: string;
  signature: string;
  timestamp: number;
  nonce: string;
}

describe('InferenceNotarizer', () => {
  let notarizer: InferenceNotarizer;
  
  beforeEach(() => {
    notarizer = new InferenceNotarizer();
  });

  describe('Determinism Across Runs', () => {
    it('should produce identical hashes for identical inference records', () => {
      const inferenceRecord: TestInferenceRecord = {
        modelId: 'bert-v2.1',
        input: 'What is machine learning?',
        output: 'Machine learning is a subset of artificial intelligence...',
        timestamp: 1704067200,
        parameters: {
          temperature: 0.7,
          maxTokens: 256,
          topP: 0.95,
        },
      };

      const hash1 = notarizer.computeInferenceHash(inferenceRecord);
      const hash2 = notarizer.computeInferenceHash(inferenceRecord);
      const hash3 = notarizer.computeInferenceHash(inferenceRecord);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
      expect(hash1).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('should produce consistent hashes regardless of parameter object key order', () => {
      const record1: TestInferenceRecord = {
        modelId: 'gpt-3.5-turbo',
        input: 'Summarize this article',
        output: 'The article discusses renewable energy...',
        timestamp: 1704153600,
        parameters: {
          temperature: 0.5,
          topP: 0.9,
          frequencyPenalty: 0.8,
        },
      };

      const record2: TestInferenceRecord = {
        modelId: 'gpt-3.5-turbo',
        input: 'Summarize this article',
        output: 'The article discusses renewable energy...',
        timestamp: 1704153600,
        parameters: {
          frequencyPenalty: 0.8,
          temperature: 0.5,
          topP: 0.9,
        },
      };

      const hash1 = notarizer.computeInferenceHash(record1);
      const hash2 = notarizer.computeInferenceHash(record2);

      expect(hash1).toBe(hash2);
    });

    it('should handle deeply nested parameter structures consistently', () => {
      const record: TestInferenceRecord = {
        modelId: 'claude-v1',
        input: 'Generate code',
        output: 'function example() { return 42; }',
        timestamp: 1704240000,
        parameters: {
          config: {
            constraints: {
              maxDepth: 5,
              complexity: 'high',
              metadata: {
                version: '1.0',
                deprecated: false,
              },
            },
            safety: {
              enabled: true,
              level: 'strict',
            },
          },
          timeout: 30000,
        },
      };

      const hashes = Array.from({ length: 5 }, () =>
        notarizer.computeInferenceHash(record)
      );

      const firstHash = hashes[0];
      expect(hashes.every(h => h === firstHash)).toBe(true);
    });

    it('should produce deterministic hashes with unicode characters', () => {
      const record: TestInferenceRecord = {
        modelId: 'multilingual-model',
        input: '¿Cuál es el significado de la vida? 生命的意义是什么？',
        output: 'La vida tiene múltiples significados... 生命具有多重含义...',
        timestamp: 1704326400,
        parameters: { encoding: 'utf-8' },
      };

      const hash1 = notarizer.computeInferenceHash(record);
      const hash2 = notarizer.computeInferenceHash(record);

      expect(hash1).toBe(hash2);
    });
  });

  describe('Hash Uniqueness', () => {
    it('should produce different hashes for different model outputs', () => {
      const baseRecord: TestInferenceRecord = {
        modelId: 'text-davinci-003',
        input: 'What is AI?',
        timestamp: 1704412800,
        parameters: { temperature: 0.7 },
        output: '',
      };

      const hash1 = notarizer.computeInferenceHash({
        ...baseRecord,
        output: 'AI is artificial intelligence.',
      });

      const hash2 = notarizer.computeInferenceHash({
        ...baseRecord,
        output: 'AI refers to machine intelligence.',
      });

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different model IDs', () => {
      const record1: TestInferenceRecord = {
        modelId: 'model-a-v1',
        input: 'Test input',
        output: 'Test output',
        timestamp: 1704499200,
        parameters: {},
      };

      const record2: TestInferenceRecord = {
        ...record1,
        modelId: 'model-b-v1',
      };

      const hash1 = notarizer.computeInferenceHash(record1);
      const hash2 = notarizer.computeInferenceHash(record2);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different timestamps', () => {
      const baseRecord: TestInferenceRecord = {
        modelId: 'time-sensitive-model',
        input: 'Current time?',
        output: 'The current time is...',
        parameters: {},
        timestamp: 0,
      };

      const hash1 = notarizer.computeInferenceHash({
        ...baseRecord,
        timestamp: 1704585600,
      });

      const hash2 = notarizer.computeInferenceHash({
        ...baseRecord,
        timestamp: 1704585601,
      });

      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different parameter values', () => {
      const baseRecord: TestInferenceRecord = {
        modelId: 'param-sensitive',
        input: 'Input',
        output: 'Output',
        timestamp: 1704672000,
        parameters: {},
      };

      const hash1 = notarizer.computeInferenceHash({
        ...baseRecord,
        parameters: { temperature: 0.5 },
      });

      const hash2 = notarizer.computeInferenceHash({
        ...baseRecord,
        parameters: { temperature: 0.9 },
      });

      expect(hash1).not.toBe(hash2);
    });

    it('should produce unique hashes for a batch of different inferences', () => {
      const records: TestInferenceRecord[] = Array.from({ length: 100 }, (_, i) => ({
        modelId: `model-${i}`,
        input: `input-${i}`,
        output: `output-${i}`,
        timestamp: 1704758400 + i,
        parameters: { index: i },
      }));

      const hashes = records.map(r => notarizer.computeInferenceHash(r));
      const uniqueHashes = new Set(hashes);

      expect(uniqueHashes.size).toBe(100);
    });
  });

  describe('Proof Generation and Verification', () => {
    it('should