```typescript
import { FeeEstimator } from '../../src/mempool/FeeEstimator';

describe('FeeEstimator', () => {
  let feeEstimator: FeeEstimator;

  beforeEach(() => {
    feeEstimator = new FeeEstimator({
      minBaseFee: BigInt(1),
      maxBaseFee: BigInt(1000000),
      baseFeeIncrement: BigInt(10),
      baseFeeDecrement: BigInt(5),
      targetGasUsedPerBlock: 15000000n,
      elasticityMultiplier: 2n,
    });
  });

  describe('calculateBaseFee', () => {
    it('should return minimum base fee when no blocks have been processed', () => {
      const baseFee = feeEstimator.calculateBaseFee(0);
      expect(baseFee).toBe(BigInt(1));
    });

    it('should return maximum base fee when capped', () => {
      const baseFee = feeEstimator.calculateBaseFee(BigInt(1000001));
      expect(baseFee).toBe(BigInt(1000000));
    });

    it('should ramp up base fee when gas usage exceeds target', () => {
      const previousBaseFee = BigInt(100);
      const gasUsed = BigInt(20000000);
      const targetGas = BigInt(15000000);

      const baseFee = feeEstimator.calculateBaseFeeWithUsage(
        previousBaseFee,
        gasUsed,
        targetGas
      );

      expect(baseFee).toBeGreaterThan(previousBaseFee);
    });

    it('should ramp down base fee when gas usage is below target', () => {
      const previousBaseFee = BigInt(100);
      const gasUsed = BigInt(10000000);
      const targetGas = BigInt(15000000);

      const baseFee = feeStrimator.calculateBaseFeeWithUsage(
        previousBaseFee,
        gasUsed,
        targetGas
      );

      expect(baseFee).toBeLessThan(previousBaseFee);
    });

    it('should maintain base fee when gas usage equals target', () => {
      const previousBaseFee = BigInt(100);
      const gasUsed = BigInt(15000000);
      const targetGas = BigInt(15000000);

      const baseFee = feeEstimator.calculateBaseFeeWithUsage(
        previousBaseFee,
        gasUsed,
        targetGas
      );

      expect(baseFee).toBe(previousBaseFee);
    });
  });

  describe('Base Fee Ramp-Up', () => {
    it('should increase base fee proportionally when gas usage significantly exceeds target', () => {
      const previousBaseFee = BigInt(50);
      const gasUsed = BigInt(30000000);
      const targetGas = BigInt(15000000);

      const baseFee = feeEstimator.calculateBaseFeeWithUsage(
        previousBaseFee,
        gasUsed,
        targetGas
      );

      const excessGasRatio = (gasUsed - targetGas) / targetGas;
      const expectedIncrease = (previousBaseFee * excessGasRatio) / BigInt(2);
      const expectedBaseFee = previousBaseFee + expectedIncrease;

      expect(baseFee).toBe(expectedBaseFee);
    });

    it('should not exceed maximum base fee during ramp-up', () => {
      const previousBaseFee = BigInt(999900);
      const gasUsed = BigInt(45000000);
      const targetGas = BigInt(15000000);

      const baseFee = feeEstimator.calculateBaseFeeWithUsage(
        previousBaseFee,
        gasUsed,
        targetGas
      );

      expect(baseFee).toBeLessThanOrEqual(BigInt(1000000));
    });

    it('should handle rapid sequential ramp-ups', () => {
      let currentBaseFee = BigInt(100);
      const gasUsed = BigInt(25000000);
      const targetGas = BigInt(15000000);

      for (let i = 0; i < 5; i++) {
        currentBaseFee = feeEstimator.calculateBaseFeeWithUsage(
          currentBaseFee,
          gasUsed,
          targetGas
        );
      }

      expect(currentBaseFee).toBeLessThanOrEqual(BigInt(1000000));
      expect(currentBaseFee).toBeGreaterThan(BigInt(100));
    });

    it('should apply increment correctly for minimal excess gas', () => {
      const previousBaseFee = BigInt(1000);
      const gasUsed = BigInt(15000001);
      const targetGas = BigInt(15000000);

      const baseFee = feeEstimator.calculateBaseFeeWithUsage(
        previousBaseFee,
        gasUsed,
        targetGas
      );

      expect(baseFee).toBeGreaterThan(previousBaseFee);
      expect(baseFee - previousBaseFee).toBeLessThan(BigInt(100));
    });
  });

  describe('Base Fee Ramp-Down', () => {
    it('should decrease base fee when gas usage falls below target', () => {
      const previousBaseFee = BigInt(500);
      const gasUsed = BigInt(5000000);
      const targetGas = BigInt(15000000);

      const baseFee = feeEstimator.calculateBaseFeeWithUsage(
        previousBaseFee,
        gasUsed,
        targetGas
      );

      expect(baseFee).toBeLessThan(previousBaseFee);
    });

    it('should not go below minimum base fee during ramp-down', () => {
      const previousBaseFee = BigInt(5);
      const gasUsed = BigInt(1000000);
      const targetGas = BigInt(15000000);

      const baseFee = feeEstimator.calculateBaseFeeWithUsage(
        previousBaseFee,
        gasUsed,
        targetGas
      );

      expect(baseFee).toBeGreaterThanOrEqual(BigInt(1));
    });

    it('should handle rapid sequential ramp-downs', () => {
      let currentBaseFee = BigInt(10000);
      const gasUsed = BigInt(1000000);
      const targetGas = BigInt(15000000);

      for (let i = 0; i < 5; i++) {
        currentBaseFee = feeEstimator.calculateBaseFeeWithUsage(
          currentBaseFee,
          gasUsed,
          targetGas
        );
      }

      expect(currentBaseFee).toBeGreaterThanOrEqual(BigInt(1));
      expect(currentBaseFee).toBeLessThan(BigInt(10000));
    });

    it('should apply decrement correctly for minimal deficit gas', () => {
      const previousBaseFee = BigInt(1000);
      const gasUsed = BigInt(14999999);
      const targetGas = BigInt(15000000);

      const baseFee = feeEstimator.calculateBaseFeeWithUsage(
        previousBaseFee,
        gasUsed,
        targetGas
      );

      expect(baseFee).toBeLessThan(previousBaseFee);
      expect(previousBaseFee - baseFee).toBeLessThan(BigInt(100));
    });
  });

  describe('Edge Cases at Minimum', () => {
    it('should handle base fee at minimum boundary', () => {
      const baseFee = feeEstimator.calculateBaseFee(BigInt(0));
      expect(baseFee).toBe(BigInt(1));
    });

    it('should not allow negative base fees', () => {
      const previousBaseFee = BigInt(2);
      const gasUsed = BigInt(100000);
      const targetGas = BigInt(15000000);

      const baseFee = feeEstimator.calculateBaseFeeWithUs