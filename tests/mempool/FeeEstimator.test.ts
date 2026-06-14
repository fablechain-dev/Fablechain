```typescript
import { FeeEstimator } from '../../src/mempool/FeeEstimator';

describe('FeeEstimator', () => {
  let feeEstimator: FeeEstimator;

  const DEFAULT_BASE_FEE = BigInt(1000000000); // 1 Gwei
  const MIN_BASE_FEE = BigInt(1000000); // 0.001 Gwei
  const MAX_BASE_FEE = BigInt(1000000000000); // 1000 Gwei
  const ELASTICITY_MULTIPLIER = 2;
  const BASE_FEE_MAX_CHANGE_DENOMINATOR = 8;

  beforeEach(() => {
    feeEstimator = new FeeEstimator({
      initialBaseFee: DEFAULT_BASE_FEE,
      minBaseFee: MIN_BASE_FEE,
      maxBaseFee: MAX_BASE_FEE,
      elasticityMultiplier: ELASTICITY_MULTIPLIER,
      baseFeeMaxChangeDenominator: BASE_FEE_MAX_CHANGE_DENOMINATOR,
      targetGasPerBlock: BigInt(15000000),
    });
  });

  describe('Base Fee Ramp-Up', () => {
    it('should increase base fee when gas used exceeds target', () => {
      const gasUsed = BigInt(20000000); // Exceeds target of 15000000
      const targetGas = BigInt(15000000);

      const newBaseFee = feeEstimator.calculateBaseFee(
        DEFAULT_BASE_FEE,
        gasUsed,
        targetGas
      );

      expect(newBaseFee).toBeGreaterThan(DEFAULT_BASE_FEE);
    });

    it('should increase base fee by correct percentage during ramp-up', () => {
      const gasUsed = BigInt(18750000); // 25% above target (15M)
      const targetGas = BigInt(15000000);

      const newBaseFee = feeEstimator.calculateBaseFee(
        DEFAULT_BASE_FEE,
        gasUsed,
        targetGas
      );

      // Expected increase: (18750000 - 15000000) / 15000000 / 8 = 3.125%
      const expectedIncrease = DEFAULT_BASE_FEE / BigInt(32); // ~3.125%
      const expectedBaseFee = DEFAULT_BASE_FEE + expectedIncrease;

      expect(newBaseFee).toBeLessThanOrEqual(expectedBaseFee + BigInt(1));
      expect(newBaseFee).toBeGreaterThanOrEqual(expectedBaseFee - BigInt(1));
    });

    it('should respect max base fee ceiling during ramp-up', () => {
      feeEstimator = new FeeEstimator({
        initialBaseFee: BigInt(900000000000), // 900 Gwei (near max)
        minBaseFee: MIN_BASE_FEE,
        maxBaseFee: MAX_BASE_FEE,
        elasticityMultiplier: ELASTICITY_MULTIPLIER,
        baseFeeMaxChangeDenominator: BASE_FEE_MAX_CHANGE_DENOMINATOR,
        targetGasPerBlock: BigInt(15000000),
      });

      const gasUsed = BigInt(30000000); // Significantly above target
      const targetGas = BigInt(15000000);

      const newBaseFee = feeEstimator.calculateBaseFee(
        BigInt(900000000000),
        gasUsed,
        targetGas
      );

      expect(newBaseFee).toBeLessThanOrEqual(MAX_BASE_FEE);
    });

    it('should cap at max base fee even with extreme gas usage', () => {
      const gasUsed = BigInt(300000000); // Extreme gas usage
      const targetGas = BigInt(15000000);

      const newBaseFee = feeEstimator.calculateBaseFee(
        DEFAULT_BASE_FEE,
        gasUsed,
        targetGas
      );

      expect(newBaseFee).toBeLessThanOrEqual(MAX_BASE_FEE);
    });
  });

  describe('Base Fee Ramp-Down', () => {
    it('should decrease base fee when gas used is below target', () => {
      const gasUsed = BigInt(10000000); // Below target of 15000000
      const targetGas = BigInt(15000000);

      const newBaseFee = feeEstimator.calculateBaseFee(
        DEFAULT_BASE_FEE,
        gasUsed,
        targetGas
      );

      expect(newBaseFee).toBeLessThan(DEFAULT_BASE_FEE);
    });

    it('should decrease base fee by correct percentage during ramp-down', () => {
      const gasUsed = BigInt(11250000); // 25% below target (15M)
      const targetGas = BigInt(15000000);

      const newBaseFee = feeEstimator.calculateBaseFee(
        DEFAULT_BASE_FEE,
        gasUsed,
        targetGas
      );

      // Expected decrease: (15000000 - 11250000) / 15000000 / 8 = 3.125%
      const expectedDecrease = DEFAULT_BASE_FEE / BigInt(32); // ~3.125%
      const expectedBaseFee = DEFAULT_BASE_FEE - expectedDecrease;

      expect(newBaseFee).toBeLessThanOrEqual(expectedBaseFee + BigInt(1));
      expect(newBaseFee).toBeGreaterThanOrEqual(expectedBaseFee - BigInt(1));
    });

    it('should respect min base fee floor during ramp-down', () => {
      feeEstimator = new FeeEstimator({
        initialBaseFee: BigInt(2000000), // 2x min fee
        minBaseFee: MIN_BASE_FEE,
        maxBaseFee: MAX_BASE_FEE,
        elasticityMultiplier: ELASTICITY_MULTIPLIER,
        baseFeeMaxChangeDenominator: BASE_FEE_MAX_CHANGE_DENOMINATOR,
        targetGasPerBlock: BigInt(15000000),
      });

      const gasUsed = BigInt(0); // No gas used
      const targetGas = BigInt(15000000);

      const newBaseFee = feeEstimator.calculateBaseFee(
        BigInt(2000000),
        gasUsed,
        targetGas
      );

      expect(newBaseFee).toBeGreaterThanOrEqual(MIN_BASE_FEE);
    });

    it('should not go below min base fee even with zero gas usage', () => {
      const gasUsed = BigInt(0);
      const targetGas = BigInt(15000000);

      const newBaseFee = feeEstimator.calculateBaseFee(
        MIN_BASE_FEE,
        gasUsed,
        targetGas
      );

      expect(newBaseFee).toBeGreaterThanOrEqual(MIN_BASE_FEE);
    });
  });

  describe('Edge Cases at Min/Max Boundaries', () => {
    it('should remain at min base fee when at minimum boundary with low gas', () => {
      const newBaseFee = feeEstimator.calculateBaseFee(
        MIN_BASE_FEE,
        BigInt(0),
        BigInt(15000000)
      );

      expect(newBaseFee).toEqual(MIN_BASE_FEE);
    });

    it('should increase from min base fee when gas exceeds target', () => {
      const newBaseFee = feeEstimator.calculateBaseFee(
        MIN_BASE_FEE,
        BigInt(20000000),
        BigInt(15000000)
      );

      expect(newBaseFee).toBeGreaterThan(MIN_BASE_FEE);
      expect(newBaseFee).toBeLessThanOrEqual(MAX_BASE_FEE);
    });

    it('should remain at max base