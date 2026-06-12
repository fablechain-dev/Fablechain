import { Chain } from '../blockchain/Chain';
import { TransactionPool } from '../blockchain/TransactionPool';
import { ValidatorManager } from '../validators/ValidatorManager';

export class HealthCheckController {
  private chain: Chain;
  private txPool: TransactionPool;
  private validatorManager: ValidatorManager;

  constructor(chain: Chain, txPool: TransactionPool, validatorManager: ValidatorManager) {
    this.chain = chain;
    this.txPool = txPool;
    this.validatorManager = validatorManager;
  }

  async getHealthStatus(req, res) {
    const chainLength = this.chain.getChainLength();
    const pendingTxCount = this.txPool.getPendingCount();
    const validatorCount = this.validatorManager.getAllValidators().length;

    res.status(200).json({
      status: 'ok',
      chainLength,
      pendingTransactions: pendingTxCount,
      validators: validatorCount
    });
  }

  async getReadinessStatus(req, res) {
    // Additional checks for readiness, e.g.:
    // - Ensure chain is synced to latest block
    // - Verify validator is actively producing blocks
    // - Check for any critical errors or issues

    res.status(200).json({
      status: 'ready'
    });
  }
}