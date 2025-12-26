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

export const REGIONAL_MIN_WAGE_CURRENT: Record<Region, number> = {
  // Hiện hành theo bảng lương tối thiểu vùng (trước 01/01/2026)
  I: 4_960_000,
  II: 4_410_000,
  III: 3_860_000,
  IV: 3_450_000,
};

export const REGIONAL_MIN_WAGE_2026: Record<Region, number> = {
  // Áp dụng từ 01/01/2026 theo Nghị định 293/2025/NĐ-CP
  I: 5_310_000,
  II: 4_730_000,
  III: 4_140_000,
  IV: 3_700_000,
};

export const REGIONS: Record<Region, { minWage: number }> = {
  I: { minWage: REGIONAL_MIN_WAGE_CURRENT.I },
  II: { minWage: REGIONAL_MIN_WAGE_CURRENT.II },
  III: { minWage: REGIONAL_MIN_WAGE_CURRENT.III },
  IV: { minWage: REGIONAL_MIN_WAGE_CURRENT.IV },
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
