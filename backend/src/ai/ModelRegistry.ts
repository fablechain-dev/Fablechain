```typescript
import { Contract, ethers } from 'ethers';
import { createHash } from 'crypto';

interface ModelMetadata {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  modelHash: string;
  ipfsHash?: string;
  owner: string;
  createdAt: number;
  updatedAt: number;
  deprecated: boolean;
  compatibilityVersion: string;
}

interface ModelRegistryEntry {
  id: string;
  metadata: ModelMetadata;
  versionHistory: ModelVersion[];
  accessControl: AccessControl;
}

interface ModelVersion {
  version: string;
  modelHash: string;
  timestamp: number;
  changelog: string;
}

interface AccessControl {
  isPublic: boolean;
  allowedAddresses: Set<string>;
  requiredRole?: string;
}

interface QueryFilter {
  capabilities?: string[];
  owner?: string;
  deprecated?: boolean;
  compatibilityVersion?: string;
  limit?: number;
  offset?: number;
}

interface RegistryEvent {
  type: 'register' | 'update' | 'deprecate' | 'access';
  modelId: string;
  timestamp: number;
  actor: string;
  details: Record<string, unknown>;
}

export class ModelRegistry {
  private registry: Map<string, ModelRegistryEntry>;
  private modelsByCapability: Map<string, Set<string>>;
  private modelsByOwner: Map<string, Set<string>>;
  private eventLog: RegistryEvent[];
  private contractAddress?: string;
  private contract?: Contract;
  private signer?: ethers.Signer;
  private maxVersionHistory: number = 50;

  constructor() {
    this.registry = new Map();
    this.modelsByCapability = new Map();
    this.modelsByOwner = new Map();
    this.eventLog = [];
  }

  async initialize(contractAddress: string, signer: ethers.Signer): Promise<void> {
    this.contractAddress = contractAddress;
    this.signer = signer;
    const abi = this.getContractABI();
    this.contract = new Contract(contractAddress, abi, signer);
    await this.syncFromChain();
  }

  async registerModel(metadata: ModelMetadata): Promise<string> {
    const modelId = this.generateModelId(metadata.modelHash);

    if (this.registry.has(modelId)) {
      throw new Error(`Model with ID ${modelId} already registered`);
    }

    if (!this.validateMetadata(metadata)) {
      throw new Error('Invalid model metadata');
    }

    const entry: ModelRegistryEntry = {
      id: modelId,
      metadata,
      versionHistory: [
        {
          version: metadata.version,
          modelHash: metadata.modelHash,
          timestamp: Date.now(),
          changelog: 'Initial registration',
        },
      ],
      accessControl: {
        isPublic: true,
        allowedAddresses: new Set([metadata.owner]),
      },
    };

    this.registry.set(modelId, entry);

    for (const capability of metadata.capabilities) {
      if (!this.modelsByCapability.has(capability)) {
        this.modelsByCapability.set(capability, new Set());
      }
      this.modelsByCapability.get(capability)!.add(modelId);
    }

    if (!this.modelsByOwner.has(metadata.owner)) {
      this.modelsByOwner.set(metadata.owner, new Set());
    }
    this.modelsByOwner.get(metadata.owner)!.add(modelId);

    this.logEvent({
      type: 'register',
      modelId,
      timestamp: Date.now(),
      actor: metadata.owner,
      details: { metadata },
    });

    if (this.contract && this.signer) {
      await this.publishToChain(modelId, metadata);
    }

    return modelId;
  }

  async updateModel(modelId: string, updates: Partial<ModelMetadata>): Promise<void> {
    const entry = this.registry.get(modelId);
    if (!entry) {
      throw new Error(`Model ${modelId} not found`);
    }

    const previousMetadata = { ...entry.metadata };
    const updatedMetadata = { ...entry.metadata, ...updates };

    if (!this.validateMetadata(updatedMetadata)) {
      throw new Error('Invalid updated metadata');
    }

    entry.metadata = updatedMetadata;

    if (updates.version && updates.version !== previousMetadata.version) {
      entry.versionHistory.push({
        version: updates.version,
        modelHash: updates.modelHash || previousMetadata.modelHash,
        timestamp: Date.now(),
        changelog: updates.description || 'Version update',
      });

      if (entry.versionHistory.length > this.maxVersionHistory) {
        entry.versionHistory.shift();
      }
    }

    if (updates.capabilities) {
      for (const oldCap of previousMetadata.capabilities) {
        this.modelsByCapability.get(oldCap)?.delete(modelId);
      }

      for (const newCap of updates.capabilities) {
        if (!this.modelsByCapability.has(newCap)) {
          this.modelsByCapability.set(newCap, new Set());
        }
        this.modelsByCapability.get(newCap)!.add(modelId);
      }
    }

    this.logEvent({
      type: 'update',
      modelId,
      timestamp: Date.now(),
      actor: updatedMetadata.owner,
      details: { previousMetadata, updates },
    });

    if (this.contract && this.signer) {
      await this.publishToChain(modelId, updatedMetadata);
    }
  }

  deprecateModel(modelId: string, reason?: string): void {
    const entry = this.registry.get(modelId);
    if (!entry) {
      throw new Error(`Model ${modelId} not found`);
    }

    entry.metadata.deprecated = true;
    entry.metadata.updatedAt = Date.now();

    this.logEvent({
      type: 'deprecate',
      modelId,
      timestamp: Date.now(),
      actor: entry.metadata.owner,
      details: { reason: reason || 'No reason provided' },
    });
  }

  lookupByCapability(capability: string): ModelMetadata[] {
    const modelIds = this.modelsByCapability.get(capability);
    if (!modelIds) {
      return [];
    }

    return Array.from(modelIds)
      .map((id) => this.registry.get(id)?.metadata)
      .filter((metadata): metadata is ModelMetadata => metadata !== undefined && !metadata.deprecated);
  }

  lookupByCapabilities(capabilities: string[], matchAll: boolean = false): ModelMetadata[] {
    const results = capabilities.map((cap) => this.lookupByCapability(cap));

    if (matchAll) {
      const modelIdSets = results.map((models) => new Set(models.map((m) => m.modelHash)));
      const intersection = Array.from(modelIdSets[0] || []).filter((id) =>
        modelIdSets.every((set) => set.has(id))
      );
      return Array.from(intersection)
        .map((hash) => Array.from(this.registry.values()).find((e) => e.metadata.modelHash === hash)?.metadata)
        .filter((metadata): metadata is ModelMetadata => metadata !== undefined);
    }

    const combined = new Map<string, ModelMetadata>();
    for (const models of results) {
      for (const model of models) {
        combined.set(model.modelHash, model);
      }
    }
    return Array.from(combined.values());
  }

  lookupById(modelId: string): ModelMetadata | null {
    return this.registry.get(modelId)?.metadata || null;
  }

  lookupByHash(modelHash: string): ModelMetadata | null {
    for (const entry of this.registry.values()) {
      if (entry