```typescript
import { ethers } from 'ethers';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';

interface ReputationScore {
  agentId: string;
  score: number;
  taskSuccessRate: number;
  hallucination_penalty: number;
  lastUpdated: number;
  totalTasksCompleted: number;
  failedTasks: number;
  hallucinationCount: number;
  ema: number;
  emaSmoothingFactor: number;
}

interface TaskResult {
  agentId: string;
  taskId: string;
  success: boolean;
  hallucinationDetected: boolean;
  timestamp: number;
  executionTime: number;
  confidenceScore: number;
}

interface ReputationConfig {
  initialScore: number;
  minScore: number;
  maxScore: number;
  hallucination_penalty_multiplier: number;
  emaSmoothingFactor: number;
  successRateWeight: number;
  hallucinationWeight: number;
  eemaWeight: number;
}

export class AgentReputationScorer {
  private reputationScores: Map<string, ReputationScore>;
  private taskHistory: Map<string, TaskResult[]>;
  private config: ReputationConfig;
  private logger: Logger;
  private contract: ethers.Contract | null;
  private contractAddress: string | null;
  private signer: ethers.Signer | null;

  constructor(
    config?: Partial<ReputationConfig>,
    contractAddress?: string,
    signer?: ethers.Signer
  ) {
    this.reputationScores = new Map();
    this.taskHistory = new Map();
    this.contractAddress = contractAddress || null;
    this.signer = signer || null;
    this.contract = null;

    this.config = {
      initialScore: 5000,
      minScore: 0,
      maxScore: 10000,
      hallucination_penalty_multiplier: 2.5,
      emaSmoothingFactor: 0.3,
      successRateWeight: 0.4,
      hallucinationWeight: 0.35,
      eemaWeight: 0.25,
      ...config,
    };

    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.File({ filename: 'logs/reputation-error.log', level: 'error' }),
        new transports.File({ filename: 'logs/reputation-combined.log' }),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        })
      );
    }
  }

  async initializeContract(abi: ethers.ContractInterface): Promise<void> {
    if (!this.contractAddress || !this.signer) {
      this.logger.warn('Contract initialization skipped: missing address or signer');
      return;
    }

    try {
      this.contract = new ethers.Contract(this.contractAddress, abi, this.signer);
      this.logger.info(`Reputation contract initialized at ${this.contractAddress}`);
    } catch (error) {
      this.logger.error('Failed to initialize reputation contract', { error });
      throw error;
    }
  }

  registerAgent(agentId: string): ReputationScore {
    if (this.reputationScores.has(agentId)) {
      this.logger.warn(`Agent ${agentId} already registered`);
      return this.reputationScores.get(agentId)!;
    }

    const score: ReputationScore = {
      agentId,
      score: this.config.initialScore,
      taskSuccessRate: 1.0,
      hallucination_penalty: 0,
      lastUpdated: Date.now(),
      totalTasksCompleted: 0,
      failedTasks: 0,
      hallucinationCount: 0,
      ema: this.config.initialScore,
      emaSmoothingFactor: this.config.emaSmoothingFactor,
    };

    this.reputationScores.set(agentId, score);
    this.taskHistory.set(agentId, []);

    this.logger.info(`Agent registered: ${agentId} with initial score ${this.config.initialScore}`);
    return score;
  }

  async recordTaskResult(result: TaskResult): Promise<ReputationScore> {
    if (!this.reputationScores.has(result.agentId)) {
      this.registerAgent(result.agentId);
    }

    const reputation = this.reputationScores.get(result.agentId)!;
    const history = this.taskHistory.get(result.agentId)!;

    history.push(result);
    reputation.totalTasksCompleted += 1;

    if (!result.success) {
      reputation.failedTasks += 1;
    }

    if (result.hallucinationDetected) {
      reputation.hallucinationCount += 1;
    }

    reputation.taskSuccessRate =
      (reputation.totalTasksCompleted - reputation.failedTasks) / reputation.totalTasksCompleted;

    const updatedScore = this.calculateReputationScore(reputation);
    reputation.score = updatedScore;
    reputation.lastUpdated = Date.now();

    this.logger.info(`Task result recorded for agent ${result.agentId}`, {
      taskId: result.taskId,
      success: result.success,
      hallucinationDetected: result.hallucinationDetected,
      newScore: updatedScore,
    });

    await this.persistScoreOnChain(reputation);

    return reputation;
  }

  private calculateReputationScore(reputation: ReputationScore): number {
    const successComponent = reputation.taskSuccessRate * this.config.maxScore;

    const hallucinationPenalty =
      reputation.hallucinationCount * this.config.hallucination_penalty_multiplier * 100;

    const ema = this.calculateExponentialMovingAverage(reputation);

    const weightedScore =
      successComponent * this.config.successRateWeight +
      (this.config.maxScore - Math.min(hallucinationPenalty, this.config.maxScore)) *
        this.config.hallucinationWeight +
      ema * this.config.eemaWeight;

    const finalScore = Math.max(
      this.config.minScore,
      Math.min(this.config.maxScore, weightedScore)
    );

    reputation.hallucination_penalty = hallucinationPenalty;
    reputation.ema = ema;

    return finalScore;
  }

  private calculateExponentialMovingAverage(reputation: ReputationScore): number {
    const history = this.taskHistory.get(reputation.agentId) || [];

    if (history.length === 0) {
      return reputation.score;
    }

    let ema = reputation.ema;
    const recentTasks = history.slice(-50);

    for (const task of recentTasks) {
      const taskScore = task.success ? this.config.maxScore : 0;
      ema = taskScore * this.config.emaSmoothingFactor + ema * (1 - this.config.emaSmoothingFactor);
    }

    return ema;
  }

  private async persistScoreOnChain(reputation: ReputationScore): Promise<void> {
    if (!this.contract) {
      return;
    }

    try {
      const tx = await this.contract.updateAgentReputation(
        reputation.agentId,
        Math.floor(reputation.score),
        Math.floor(reputation.taskSuccessRate * 10000),