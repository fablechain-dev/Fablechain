```typescript
import crypto from 'crypto';
import { EventEmitter } from 'events';

interface ModelWeights {
  layerId: string;
  weights: Buffer;
  biases?: Buffer;
  metadata?: Record<string, unknown>;
}

interface InferenceInput {
  modelId: string;
  inputData: Buffer;
  parameters?: Record<string, unknown>;
}

interface InferenceOutput {
  predictions: Buffer;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

interface NotarizationProof {
  proofHash: string;
  modelWeightsHash: string;
  inputHash: string;
  outputHash: string;
  timestamp: number;
  nonce: string;
  version: string;
}

interface ChainProof {
  notarizationId: string;
  proof: NotarizationProof;
  signature: string;
  blockNumber?: number;
  transactionHash?: string;
  verified: boolean;
}

interface HashableComponent {
  hash: string;
  size: number;
  algorithm: string;
}

class InferenceNotarizer extends EventEmitter {
  private readonly hashAlgorithm: string = 'sha256';
  private readonly version: string = '1.0.0';
  private modelWeightsCache: Map<string, HashableComponent>;
  private notarizationHistory: Map<string, ChainProof>;
  private signingKey: string;

  constructor(signingKey: string) {
    super();
    this.signingKey = signingKey;
    this.modelWeightsCache = new Map();
    this.notarizationHistory = new Map();
  }

  private hashBuffer(data: Buffer): string {
    return crypto
      .createHash(this.hashAlgorithm)
      .update(data)
      .digest('hex');
  }

  private hashObject(obj: Record<string, unknown>): string {
    const json = JSON.stringify(obj, (_, v) => {
      if (Buffer.isBuffer(v)) {
        return v.toString('hex');
      }
      return v;
    });
    return this.hashBuffer(Buffer.from(json));
  }

  public registerModelWeights(weights: ModelWeights[]): string {
    let combinedBuffer = Buffer.alloc(0);

    for (const weight of weights) {
      combinedBuffer = Buffer.concat([
        combinedBuffer,
        Buffer.from(weight.layerId),
        weight.weights,
        weight.biases || Buffer.alloc(0),
      ]);
    }

    const weightsHash = this.hashBuffer(combinedBuffer);
    const size = combinedBuffer.length;

    const component: HashableComponent = {
      hash: weightsHash,
      size,
      algorithm: this.hashAlgorithm,
    };

    const modelId = this.hashBuffer(
      Buffer.from(JSON.stringify(weights.map((w) => w.layerId)))
    );
    this.modelWeightsCache.set(modelId, component);

    this.emit('weights-registered', {
      modelId,
      weightsHash,
      size,
      timestamp: Date.now(),
    });

    return modelId;
  }

  public notarizeInference(
    input: InferenceInput,
    output: InferenceOutput,
    modelWeightsHash: string
  ): NotarizationProof {
    const inputHash = this.hashBuffer(input.inputData);
    const outputHash = this.hashBuffer(output.predictions);

    const parametersHash = input.parameters
      ? this.hashObject(input.parameters)
      : this.hashBuffer(Buffer.alloc(0));

    const outputMetadataHash = output.metadata
      ? this.hashObject(output.metadata)
      : this.hashBuffer(Buffer.alloc(0));

    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');

    const proofComponents = Buffer.concat([
      Buffer.from(modelWeightsHash),
      Buffer.from(inputHash),
      Buffer.from(parametersHash),
      Buffer.from(outputHash),
      Buffer.from(outputMetadataHash),
      Buffer.from(input.modelId),
      Buffer.from(timestamp.toString()),
      Buffer.from(nonce),
      Buffer.from(this.version),
    ]);

    const proofHash = this.hashBuffer(proofComponents);

    const proof: NotarizationProof = {
      proofHash,
      modelWeightsHash,
      inputHash,
      outputHash,
      timestamp,
      nonce,
      version: this.version,
    };

    this.emit('inference-notarized', {
      proofHash,
      modelId: input.modelId,
      timestamp,
    });

    return proof;
  }

  public signProof(proof: NotarizationProof): string {
    const proofString = JSON.stringify(proof);
    const hmac = crypto.createHmac(this.hashAlgorithm, this.signingKey);
    hmac.update(proofString);
    return hmac.digest('hex');
  }

  public createChainProof(
    proof: NotarizationProof,
    signature: string
  ): ChainProof {
    const notarizationId = crypto
      .randomBytes(32)
      .toString('hex');

    const chainProof: ChainProof = {
      notarizationId,
      proof,
      signature,
      verified: this.verifyProofSignature(proof, signature),
    };

    this.notarizationHistory.set(notarizationId, chainProof);

    this.emit('chain-proof-created', {
      notarizationId,
      verified: chainProof.verified,
    });

    return chainProof;
  }

  public recordBlockchainConfirmation(
    notarizationId: string,
    blockNumber: number,
    transactionHash: string
  ): ChainProof | null {
    const chainProof = this.notarizationHistory.get(notarizationId);

    if (!chainProof) {
      throw new Error(`Notarization ${notarizationId} not found`);
    }

    chainProof.blockNumber = blockNumber;
    chainProof.transactionHash = transactionHash;

    this.emit('blockchain-confirmed', {
      notarizationId,
      blockNumber,
      transactionHash,
    });

    return chainProof;
  }

  private verifyProofSignature(
    proof: NotarizationProof,
    signature: string
  ): boolean {
    try {
      const expectedSignature = this.signProof(proof);
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  public verifyChainProof(chainProof: ChainProof): boolean {
    if (!chainProof.verified) {
      return false;
    }

    const signatureValid = this.verifyProofSignature(
      chainProof.proof,
      chainProof.signature
    );

    if (!signatureValid) {
      return false;
    }

    if (!chainProof.blockNumber || !chainProof.transactionHash) {
      return false;
    }

    return true;
  }

  public getNotarization(notarizationId: string): ChainProof | null {
    return this.notarizationHistory.get(notarizationId) || null;
  }

  public getModelWeightsHash(modelId: string): HashableComponent | null {
    return this.modelWeightsCache.get(modelId) || null;
  }

  public getAllNotarizations(): ChainProof[] {
    return Array.from(this.notarizationHistory.values());
  }

  public getNotarizationsByTimeRange(
    startTime: number,
    endTime: number
  ): ChainProof[] {
    return Array.from(this.notarizationHistory.values()).filter((proof) => {
      const time =