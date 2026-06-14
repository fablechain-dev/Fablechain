```typescript
import {
  Contract,
  ContractInterface,
  EventFilter,
  Signer,
  BigNumberish,
  ethers,
} from "ethers";
import { Logger } from "../utils/Logger";
import { CacheManager } from "../utils/CacheManager";

export interface ModelMetadata {
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  minGasRequired: BigNumberish;
  author: string;
  timestamp: number;
  deprecated: boolean;
}

export interface RegisteredModel {
  modelHash: string;
  metadata: ModelMetadata;
  registeredAt: number;
  registeredBy: string;
  isActive: boolean;
  versionHistory: VersionRecord[];
}

export interface VersionRecord {
  version: string;
  hash: string;
  timestamp: number;
  changes: string;
}

export interface ModelQueryFilter {
  capability?: string;
  author?: string;
  minVersion?: string;
  activeOnly?: boolean;
  limit?: number;
}

const MODEL_REGISTRY_ABI = [
  {
    name: "registerModel",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_modelHash", type: "bytes32" },
      { name: "_name", type: "string" },
      { name: "_version", type: "string" },
      { name: "_description", type: "string" },
      { name: "_capabilities", type: "string[]" },
      { name: "_inputSchema", type: "string" },
      { name: "_outputSchema", type: "string" },
      { name: "_minGasRequired", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "updateModelVersion",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_modelHash", type: "bytes32" },
      { name: "_newVersion", type: "string" },
      { name: "_changes", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "deprecateModel",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_modelHash", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "getModel",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_modelHash", type: "bytes32" }],
    outputs: [{ name: "", type: "tuple", components: [] }],
  },
  {
    name: "getModelsByCapability",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_capability", type: "string" }],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
  {
    name: "getAllModels",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32[]" }],
  },
  {
    name: "ModelRegistered",
    type: "event",
    inputs: [
      { name: "modelHash", type: "bytes32", indexed: true },
      { name: "author", type: "address", indexed: true },
      { name: "name", type: "string" },
      { name: "version", type: "string" },
    ],
  },
  {
    name: "ModelUpdated",
    type: "event",
    inputs: [
      { name: "modelHash", type: "bytes32", indexed: true },
      { name: "newVersion", type: "string" },
      { name: "timestamp", type: "uint256" },
    ],
  },
  {
    name: "ModelDeprecated",
    type: "event",
    inputs: [
      { name: "modelHash", type: "bytes32", indexed: true },
      { name: "deprecatedAt", type: "uint256" },
    ],
  },
];

export class ModelRegistry {
  private contract: Contract;
  private signer: Signer;
  private logger: Logger;
  private cache: CacheManager;
  private registryAddress: string;
  private localRegistry: Map<string, RegisteredModel>;

  constructor(
    registryAddress: string,
    signer: Signer,
    logger: Logger,
    cacheManager: CacheManager
  ) {
    this.registryAddress = registryAddress;
    this.signer = signer;
    this.logger = logger;
    this.cache = cacheManager;
    this.localRegistry = new Map();

    this.contract = new Contract(
      registryAddress,
      MODEL_REGISTRY_ABI,
      signer
    );

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const modelRegisteredFilter = this.contract.filters.ModelRegistered?.() as EventFilter;
    const modelUpdatedFilter = this.contract.filters.ModelUpdated?.() as EventFilter;
    const modelDeprecatedFilter = this.contract.filters.ModelDeprecated?.() as EventFilter;

    if (modelRegisteredFilter) {
      this.contract.on(modelRegisteredFilter, (modelHash, author, name, version) => {
        this.logger.info(`Model registered: ${name} v${version}`);
        this.cache.invalidate(`model:${modelHash}`);
      });
    }

    if (modelUpdatedFilter) {
      this.contract.on(modelUpdatedFilter, (modelHash, newVersion) => {
        this.logger.info(`Model updated: ${modelHash} to v${newVersion}`);
        this.cache.invalidate(`model:${modelHash}`);
      });
    }

    if (modelDeprecatedFilter) {
      this.contract.on(modelDeprecatedFilter, (modelHash) => {
        this.logger.info(`Model deprecated: ${modelHash}`);
        this.cache.invalidate(`model:${modelHash}`);
      });
    }
  }

  async registerModel(metadata: ModelMetadata): Promise<string> {
    try {
      const modelHash = this.computeModelHash(metadata);

      const existingModel = this.localRegistry.get(modelHash);
      if (existingModel) {
        throw new Error(`Model already registered: ${modelHash}`);
      }

      const inputSchemaJson = JSON.stringify(metadata.inputSchema);
      const outputSchemaJson = JSON.stringify(metadata.outputSchema);

      const tx = await this.contract.registerModel(
        modelHash,
        metadata.name,
        metadata.version,
        metadata.description,
        metadata.capabilities,
        inputSchemaJson,
        outputSchemaJson,
        metadata.minGasRequired
      );

      const receipt = await tx.wait();

      const signerAddress = await this.signer.getAddress();

      const registeredModel: RegisteredModel = {
        modelHash,
        metadata,
        registeredAt: Math.floor(Date.now() / 1000),
        registeredBy: signerAddress,
        isActive: true,
        versionHistory: [
          {
            version: metadata.version,
            hash: modelHash,
            timestamp: Math.floor(Date.now() / 1000),
            changes: "Initial registration",
          },
        ],
      };

      this.localRegistry.set(modelHash, registeredModel);
      this.cache.set(`model:${modelHash}`, registeredModel, 3600);

      this.logger.info(
        `Model registered successfully: ${metadata.name} (${modelHash})`
      );

      return modelHash;
    } catch (error) {
      this.logger.error(`Failed to register model: ${error}`);
      throw error;
    }
  }

  async updateModelVersion(
    modelHash: string,
    newVersion: string,
    changes: string
  ): Promise<void> {
    try {
      const model = this.localRegistry.get(modelHash);
      if (!model)