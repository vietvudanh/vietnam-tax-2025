import { describe, it, expect } from 'vitest';
import { calculateComparison } from './taxCalculator';

describe('taxCalculator', () => {
  it('should calculate the tax comparison correctly for a high-income individual with no dependents', () => {
    // Salary: 100,000,000 VND, 0 dependents, Region I
    const result = calculateComparison(100_000_000, 0, 'I', 100_000_000);

    // Old Regulation Assertions
    expect(result.oldReg.taxAmount).toBeCloseTo(19396700);
    expect(result.oldReg.netIncome).toBeCloseTo(75165300);

    // New Regulation Assertions
    expect(result.newReg.taxAmount).toBeCloseTo(14218600);
    expect(result.newReg.netIncome).toBeCloseTo(80343400);

    // Difference Assertions
    expect(result.diffNet).toBeCloseTo(5178100);
  });

  it('should calculate the tax comparison correctly for a mid-income individual with one dependent', () => {
    // Salary: 20,000,000 VND, 1 dependent, Region IV
    const result = calculateComparison(20_000_000, 1, 'IV', 20_000_000);

    // Old Regulation Assertions
    expect(result.oldReg.taxAmount).toBeCloseTo(125000);
    expect(result.oldReg.netIncome).toBeCloseTo(17775000);

    // New Regulation Assertions (should be no tax)
    expect(result.newReg.taxAmount).toBeCloseTo(0);
    expect(result.newReg.netIncome).toBeCloseTo(17900000);

    // Difference Assertions
    expect(result.diffNet).toBeCloseTo(125000);
  });
});
