import { HealthCheckController } from '../health';
import { Chain } from '../../blockchain/Chain';
import { TransactionPool } from '../../blockchain/TransactionPool';
import { ValidatorManager } from '../../validators/ValidatorManager';

describe('HealthCheckController', () => {
  let healthCheckController: HealthCheckController;
  let chainMock: Chain;
  let txPoolMock: TransactionPool;
  let validatorManagerMock: ValidatorManager;

  beforeEach(() => {
    chainMock = {
      getChainLength: jest.fn().mockReturnValue(100),
      isSynced: jest.fn().mockResolvedValue(true)
    } as unknown as Chain;

    txPoolMock = {
      getPendingCount: jest.fn().mockReturnValue(50)
    } as unknown as TransactionPool;

    validatorManagerMock = {
      getAllValidators: jest.fn().mockReturnValue([1, 2, 3]),
      isValidatorActive: jest.fn().mockResolvedValue(true)
    } as unknown as ValidatorManager;

    healthCheckController = new HealthCheckController(chainMock, txPoolMock, validatorManagerMock);
  });

  describe('getHealthStatus', () => {
    it('should return the correct health status', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await healthCheckController.getHealthStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'ok',
        chainLength: 100,
        pendingTransactions: 50,
        validators: 3
      });
    });
  });

  describe('getReadinessStatus', () => {
    it('should return ready status when chain is synced and validator is active', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await healthCheckController.getReadinessStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'ready'
      });
    });

    it('should return not ready status when chain is not synced', async () => {
      chainMock.isSynced.mockResolvedValue(false);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await healthCheckController.getReadinessStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        status: 'not_ready',
        message: 'Chain not synced or validator not active'
      });
    });

    it('should return not ready status when validator is not active', async () => {
      validatorManagerMock.isValidatorActive.mockResolvedValue(false);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await healthCheckController.getReadinessStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        status: 'not_ready',
        message: 'Chain not synced or validator not active'
      });
    });
  });
});