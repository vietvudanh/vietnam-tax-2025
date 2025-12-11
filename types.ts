export interface TaxBracket {
  min: number; // Million VND
  max: number | null; // Null means infinity
  rate: number; // Percentage (0-100)
  desc?: string;
}

export interface TaxConfig {
  name: string;
  effectiveDate: string;
  deductionEffectiveDate?: string; // Optional separate date for deduction changes
  personalDeduction: number; // VND
  dependentDeduction: number; // VND
  brackets: TaxBracket[];
}

export interface InsuranceBreakdown {
  social: number;
  health: number;
  unemployment: number;
  total: number;
}

export type Region = 'I' | 'II' | 'III' | 'IV';

export const REGIONS: Record<Region, { minWage: number }> = {
  I: { minWage: 4_960_000 },
  II: { minWage: 4_160_000 },
  III: { minWage: 3_640_000 },
  IV: { minWage: 3_250_000 },
};

export const BASE_SALARY_2024 = 2_340_000;

export interface TaxResult {
  grossIncome: number;
  insurance: number;
  insuranceBase?: number;
  insuranceBreakdown?: {
    bhxh: number;
    bhyt: number;
    bhtn: number;
  };
  insuranceDetails: InsuranceBreakdown;
  incomeBeforeTax: number;
  personalDeduction: number;
  dependentDeduction: number;
  taxableIncome: number;
  taxAmount: number;
  netIncome: number;
  bracketsBreakdown: {
    level: number;
    amountInBracket: number;
    rate: number;
    tax: number;
  }[];
}

export interface ComparisonResult {
  oldReg: TaxResult;
  newReg: TaxResult;
  diffTax: number; // New - Old (Should be negative if tax is lower)
  diffNet: number; // New - Old (Should be positive if net is higher)
}
