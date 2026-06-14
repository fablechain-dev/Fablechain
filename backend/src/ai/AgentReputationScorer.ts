```typescript
import { ethers } from "ethers";
import { Logger } from "winston";
import { createLogger } from "winston";
import * as fs from "fs";
import * as path from "path";

interface ReputationMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  hallucinations: number;
  exponentialMovingAverage: number;
  lastUpdateTimestamp: number;
  consecutiveFailures: number;
  totalReputationScore: number;
}

interface TaskResult {
  agentId: string;
  taskId: string;
  success: boolean;
  hallucination: boolean;
  completionTime: number;
  timestamp: number;
}

interface ReputationConfig {
  successWeight: number;
  failureWeight: number;
  hallucinationPenalty: number;
  emaAlpha: number;
  minReputationScore: number;
  maxReputationScore: number;
  consecutiveFailureThreshold: number;
  hallucinationThreshold: number;
}

class AgentReputationScorer {
  private logger: Logger;
  private reputationStore: Map<string, ReputationMetrics>;
  private taskHistoryStore: Map<string, TaskResult[]>;
  private config: ReputationConfig;
  private persistencePath: string;
  private contractAddress: string;
  private ethersProvider: ethers.Provider | null;

  constructor(
    contractAddress: string,
    persistencePath: string = "./data/reputation"
  ) {
    this.logger = createLogger({
      level: "info",
      format: require("winston").format.json(),
      defaultMeta: { service: "agent-reputation-scorer" },
      transports: [new require("winston").transports.File({ filename: "error.log", level: "error" }), new require("winston").transports.File({ filename: "combined.log" })],
    });

    this.contractAddress = contractAddress;
    this.persistencePath = persistencePath;
    this.reputationStore = new Map();
    this.taskHistoryStore = new Map();
    this.ethersProvider = null;

    this.config = {
      successWeight: 0.8,
      failureWeight: -0.5,
      hallucinationPenalty: -0.3,
      emaAlpha: 0.2,
      minReputationScore: 0,
      maxReputationScore: 100,
      consecutiveFailureThreshold: 5,
      hallucinationThreshold: 3,
    };

    this.initializePersistence();
    this.logger.info(
      `AgentReputationScorer initialized with contract: ${contractAddress}`
    );
  }

  private initializePersistence(): void {
    if (!fs.existsSync(this.persistencePath)) {
      fs.mkdirSync(this.persistencePath, { recursive: true });
      this.logger.info(`Created persistence directory: ${this.persistencePath}`);
    }

    const reputationFile = path.join(this.persistencePath, "reputation.json");
    const historyFile = path.join(this.persistencePath, "history.json");

    if (fs.existsSync(reputationFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(reputationFile, "utf-8"));
        Object.entries(data).forEach(([agentId, metrics]) => {
          this.reputationStore.set(agentId, metrics as ReputationMetrics);
        });
        this.logger.info(`Loaded ${this.reputationStore.size} agent reputations`);
      } catch (error) {
        this.logger.error(`Failed to load reputation file: ${error}`);
      }
    }

    if (fs.existsSync(historyFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(historyFile, "utf-8"));
        Object.entries(data).forEach(([agentId, history]) => {
          this.taskHistoryStore.set(agentId, history as TaskResult[]);
        });
        this.logger.info(
          `Loaded history for ${this.taskHistoryStore.size} agents`
        );
      } catch (error) {
        this.logger.error(`Failed to load history file: ${error}`);
      }
    }
  }

  private persistReputation(): void {
    const reputationFile = path.join(this.persistencePath, "reputation.json");
    const data = Object.fromEntries(this.reputationStore);
    fs.writeFileSync(reputationFile, JSON.stringify(data, null, 2));
  }

  private persistHistory(): void {
    const historyFile = path.join(this.persistencePath, "history.json");
    const data = Object.fromEntries(this.taskHistoryStore);
    fs.writeFileSync(historyFile, JSON.stringify(data, null, 2));
  }

  public recordTaskResult(result: TaskResult): void {
    const { agentId, success, hallucination, timestamp } = result;

    if (!this.reputationStore.has(agentId)) {
      this.reputationStore.set(agentId, this.initializeMetrics());
    }

    if (!this.taskHistoryStore.has(agentId)) {
      this.taskHistoryStore.set(agentId, []);
    }

    const metrics = this.reputationStore.get(agentId)!;
    const history = this.taskHistoryStore.get(agentId)!;

    metrics.totalTasks += 1;
    metrics.lastUpdateTimestamp = timestamp;

    if (success) {
      metrics.successfulTasks += 1;
      metrics.consecutiveFailures = 0;
    } else {
      metrics.failedTasks += 1;
      metrics.consecutiveFailures += 1;
    }

    if (hallucination) {
      metrics.hallucinations += 1;
    }

    history.push(result);
    if (history.length > 1000) {
      history.shift();
    }

    this.updateExponentialMovingAverage(agentId);
    this.updateTotalReputationScore(agentId);

    this.reputationStore.set(agentId, metrics);
    this.taskHistoryStore.set(agentId, history);

    this.persistReputation();
    this.persistHistory();

    this.logger.info(
      `Recorded task for agent ${agentId}: success=${success}, hallucination=${hallucination}`
    );

    this.validateAgentStatus(agentId);
  }

  private updateExponentialMovingAverage(agentId: string): void {
    const metrics = this.reputationStore.get(agentId);
    if (!metrics) return;

    const successRate = metrics.successfulTasks / metrics.totalTasks;
    const currentValue = successRate * 100;

    if (metrics.totalTasks === 1) {
      metrics.exponentialMovingAverage = currentValue;
    } else {
      metrics.exponentialMovingAverage =
        this.config.emaAlpha * currentValue +
        (1 - this.config.emaAlpha) * metrics.exponentialMovingAverage;
    }

    metrics.exponentialMovingAverage = Math.max(
      this.config.minReputationScore,
      Math.min(this.config.maxReputationScore, metrics.exponentialMovingAverage)
    );
  }

  private updateTotalReputationScore(agentId: string): void {
    const metrics = this.reputationStore.get(agentId);
    if (!metrics) return;

    const successRate = metrics.successfulTasks / metrics.totalTasks;
    const failureRate = metrics.failedTasks / metrics.totalTasks;
    const hallucinationRate =
      metrics.hallucinations / Math.max(1, metrics.totalTasks);

    let score =
      successRate * this.config.successWeight +
      failureRate * this.config.failureWeight +