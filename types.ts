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

export interface TaxResult {
  grossIncome: number;
  insurance: number;
  insuranceBase?: number;
  insuranceBreakdown?: {
    bhxh: number;
    bhyt: number;
    bhtn: number;
  };
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
