import { calculateXIRR, calculateResidualValue } from './financialMath';

describe('financial-math', () => {
  describe('calculateResidualValue', () => {
    it('should return the correct residual value when past amortizations are less than face value', () => {
      expect(calculateResidualValue(1000, 200)).toBe(800);
    });

    it('should return 0 when past amortizations are greater than face value', () => {
      expect(calculateResidualValue(1000, 1200)).toBe(0);
    });

    it('should return 0 when past amortizations are equal to face value', () => {
      expect(calculateResidualValue(1000, 1000)).toBe(0);
    });

    it('should handle zero values correctly', () => {
      expect(calculateResidualValue(0, 0)).toBe(0);
    });
  });

  describe('calculateXIRR', () => {
    it('should calculate the correct XIRR for a simple investment', () => {
      const cashflows = [
        { amount: -100, date: new Date('2023-01-01') },
        { amount: 110, date: new Date('2024-01-01') },
      ];
      // The result should be close to 10%
      expect(calculateXIRR(cashflows)).toBeCloseTo(10);
    });

    it('should calculate the correct XIRR for a more complex set of cashflows', () => {
      // Example from Microsoft Excel's XIRR documentation
      const cashflows = [
        { amount: -10000, date: new Date('2008-01-01') },
        { amount: 2750, date: new Date('2008-03-01') },
        { amount: 4250, date: new Date('2008-10-30') },
        { amount: 3250, date: new Date('2009-02-15') },
        { amount: 2750, date: new Date('2009-04-01') },
      ];
      // The expected result is approximately 37.34%. Note that this differs
      // from some spreadsheet implementations which may use a different day-count convention.
      expect(calculateXIRR(cashflows)).toBeCloseTo(37.34, 2);
    });

    it('should return NaN if the calculation does not converge (e.g., all positive cashflows)', () => {
      const cashflows = [
        { amount: 100, date: new Date('2023-01-01') },
        { amount: 110, date: new Date('2024-01-01') },
      ];
      expect(calculateXIRR(cashflows)).toBeNaN();
    });
  });
});
