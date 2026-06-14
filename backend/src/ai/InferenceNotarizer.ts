```typescript
import crypto from 'crypto';
import { ethers } from 'ethers';
import { Logger } from '../utils/Logger';
import { DatabaseService } from '../services/DatabaseService';
import { BlockchainService } from '../services/BlockchainService';

interface ModelWeights {
  modelId: string;
  version: string;
  checksum: string;
  layerHashes: Map<string, string>;
}

interface InferenceInput {
  modelId: string;
  inputData: Buffer;
  inputHash: string;
  metadata: Record<string, unknown>;
}

interface InferenceOutput {
  outputData: Buffer;
  outputHash: string;
  confidence: number;
  executionTimeMs: number;
}

interface NotarizationProof {
  proofId: string;
  timestamp: number;
  modelWeightsHash: string;
  inputHash: string;
  outputHash: string;
  combinedHash: string;
  signature: string;
  transactionHash?: string;
  blockNumber?: number;
  notarizedAt: Date;
}

interface NotarizationRecord {
  proofId: string;
  modelId: string;
  modelVersion: string;
  inputHash: string;
  outputHash: string;
  modelWeightsHash: string;
  combinedHash: string;
  signature: string;
  transactionHash: string | null;
  blockNumber: number | null;
  timestamp: number;
  notarizedAt: Date;
  status: 'pending' | 'confirmed' | 'failed';
}

export class InferenceNotarizer {
  private logger: Logger;
  private db: DatabaseService;
  private blockchain: BlockchainService;
  private signingKey: string;
  private modelWeightsCache: Map<string, ModelWeights>;
  private maxCacheSize: number = 100;

  constructor(
    logger: Logger,
    db: DatabaseService,
    blockchain: BlockchainService,
    signingKey: string
  ) {
    this.logger = logger;
    this.db = db;
    this.blockchain = blockchain;
    this.signingKey = signingKey;
    this.modelWeightsCache = new Map();

    this.validateSigningKey();
  }

  private validateSigningKey(): void {
    if (!this.signingKey || this.signingKey.length < 32) {
      throw new Error('Invalid signing key provided to InferenceNotarizer');
    }
  }

  async computeModelWeightsHash(modelId: string, modelVersion: string): Promise<string> {
    const cacheKey = `${modelId}:${modelVersion}`;
    
    if (this.modelWeightsCache.has(cacheKey)) {
      const cached = this.modelWeightsCache.get(cacheKey);
      return cached!.checksum;
    }

    try {
      const weights = await this.db.getModelWeights(modelId, modelVersion);
      
      if (!weights) {
        throw new Error(`Model weights not found for ${modelId}:${modelVersion}`);
      }

      const hash = this.hashModelWeights(weights);
      
      const modelWeights: ModelWeights = {
        modelId,
        version: modelVersion,
        checksum: hash,
        layerHashes: new Map(),
      };

      this.maintainCacheSize();
      this.modelWeightsCache.set(cacheKey, modelWeights);

      return hash;
    } catch (error) {
      this.logger.error(`Failed to compute model weights hash for ${modelId}:${modelVersion}`, error);
      throw error;
    }
  }

  private hashModelWeights(weights: Buffer | string): string {
    const hash = crypto.createHash('sha256');
    
    if (typeof weights === 'string') {
      hash.update(weights);
    } else {
      hash.update(weights);
    }
    
    return hash.digest('hex');
  }

  async computeInputHash(input: InferenceInput): Promise<string> {
    const hash = crypto.createHash('sha256');
    
    hash.update(input.modelId);
    hash.update(input.inputData);
    hash.update(JSON.stringify(input.metadata));
    
    return hash.digest('hex');
  }

  async computeOutputHash(output: InferenceOutput): Promise<string> {
    const hash = crypto.createHash('sha256');
    
    hash.update(output.outputData);
    hash.update(output.confidence.toString());
    hash.update(output.executionTimeMs.toString());
    
    return hash.digest('hex');
  }

  private computeCombinedHash(
    modelWeightsHash: string,
    inputHash: string,
    outputHash: string
  ): string {
    const hash = crypto.createHash('sha256');
    
    hash.update(modelWeightsHash);
    hash.update(inputHash);
    hash.update(outputHash);
    
    return hash.digest('hex');
  }

  private signProof(combinedHash: string): string {
    const hmac = crypto.createHmac('sha256', this.signingKey);
    hmac.update(combinedHash);
    return hmac.digest('hex');
  }

  async notarizeInference(
    modelId: string,
    modelVersion: string,
    input: InferenceInput,
    output: InferenceOutput
  ): Promise<NotarizationProof> {
    const proofId = this.generateProofId();
    const timestamp = Date.now();

    try {
      this.logger.info(`Starting notarization for proof ${proofId}`, { modelId, modelVersion });

      const modelWeightsHash = await this.computeModelWeightsHash(modelId, modelVersion);
      const inputHash = await this.computeInputHash(input);
      const outputHash = await this.computeOutputHash(output);
      const combinedHash = this.computeCombinedHash(modelWeightsHash, inputHash, outputHash);
      const signature = this.signProof(combinedHash);

      const proof: NotarizationProof = {
        proofId,
        timestamp,
        modelWeightsHash,
        inputHash,
        outputHash,
        combinedHash,
        signature,
        notarizedAt: new Date(),
      };

      const record: NotarizationRecord = {
        proofId,
        modelId,
        modelVersion,
        inputHash,
        outputHash,
        modelWeightsHash,
        combinedHash,
        signature,
        transactionHash: null,
        blockNumber: null,
        timestamp,
        notarizedAt: new Date(),
        status: 'pending',
      };

      await this.db.saveNotarizationRecord(record);

      this.logger.info(`Notarization proof created: ${proofId}`, {
        combinedHash,
        status: 'pending',
      });

      return proof;
    } catch (error) {
      this.logger.error(`Failed to notarize inference for proof ${proofId}`, error);
      throw error;
    }
  }

  async submitProofToBlockchain(proof: NotarizationProof): Promise<NotarizationProof> {
    try {
      this.logger.info(`Submitting proof ${proof.proofId} to blockchain`);

      const txHash = await this.blockchain.submitInferenceProof({
        proofId: proof.proofId,
        combinedHash: proof.combinedHash,
        signature: proof.signature,
        modelWeightsHash: proof.modelWeightsHash,
        inputHash: proof.inputHash,
        outputHash: proof.outputHash,
        timestamp: proof.timestamp,
      });

      proof.transactionHash = txHash;

      await this.db.updateNotarizationRecord(proof.proofId, {
        transactionHash: txHash,
        status: 'pending',
      });

      this.logger.info(`Proof ${proof.proofId} submitted to blockchain`, { txHash });

      return proof;
    } catch (error) {
      this.logger.error