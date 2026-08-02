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
  // Trần miễn thuế tiền ăn giữa ca / ăn trưa (VNĐ/người/tháng)
  mealAllowanceCap: number;
  // Miễn thuế toàn bộ tiền lương làm thêm giờ, làm ban đêm (Điều 26 NĐ 253/2026/NĐ-CP)
  exemptOvertime: boolean;
  // Trần giảm trừ chi phí y tế (VNĐ/năm) - khoản 2 Điều 49 NĐ 253/2026/NĐ-CP
  medicalDeductionCapYear: number;
  // Trần giảm trừ chi phí giáo dục - đào tạo (VNĐ/năm)
  educationDeductionCapYear: number;
}

/** Các khoản thu nhập/chi phí bổ sung theo Nghị định 253/2026/NĐ-CP */
export interface ExtraIncomeInput {
  mealAllowance: number; // Tiền ăn giữa ca, ăn trưa (VNĐ/tháng), nằm trong lương gross
  overtimePay: number; // Tiền lương làm thêm giờ, làm ban đêm (VNĐ/tháng), nằm trong lương gross
  medicalExpensesYear: number; // Chi phí khám chữa bệnh trong nước (VNĐ/năm)
  educationExpensesYear: number; // Chi phí giáo dục - đào tạo trong nước (VNĐ/năm)
}

export const EMPTY_EXTRA_INCOME: ExtraIncomeInput = {
  mealAllowance: 0,
  overtimePay: 0,
  medicalExpensesYear: 0,
  educationExpensesYear: 0,
};

/** Trần miễn thuế tiền ăn giữa ca từ 01/7/2026 (điểm g khoản 2 Điều 8 NĐ 253/2026/NĐ-CP) */
export const MEAL_ALLOWANCE_CAP_NEW = 1_200_000;
/** Trần miễn thuế tiền ăn giữa ca trước 01/7/2026 (Thông tư 26/2016/TT-BLĐTBXH) */
export const MEAL_ALLOWANCE_CAP_OLD = 730_000;
/** Trần giảm trừ chi phí y tế (VNĐ/năm) từ 01/7/2026 */
export const MEDICAL_DEDUCTION_CAP_YEAR = 23_000_000;
/** Trần giảm trừ chi phí giáo dục - đào tạo (VNĐ/năm) từ 01/7/2026 */
export const EDUCATION_DEDUCTION_CAP_YEAR = 24_000_000;
/** Mức thu nhập bình quân tháng tối đa để được tính là người phụ thuộc (TT 87/2026/TT-BTC) */
export const DEPENDENT_INCOME_THRESHOLD = 3_000_000;
/** Ngưỡng khấu trừ 10% thu nhập vãng lai từ 01/7/2026 (Điều 50 NĐ 253/2026/NĐ-CP) */
export const CASUAL_INCOME_WITHHOLDING_THRESHOLD = 5_000_000;
/** Thu nhập vãng lai bình quân tháng không phải quyết toán (Điều 51 NĐ 253/2026/NĐ-CP) */
export const CASUAL_INCOME_NO_FINALIZATION_THRESHOLD = 15_000_000;

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
  /** Tổng thu nhập được miễn thuế (ăn giữa ca trong hạn mức + làm thêm giờ/ban đêm) */
  exemptIncome: number;
  exemptIncomeBreakdown: {
    meal: number;
    overtime: number;
  };
  personalDeduction: number;
  dependentDeduction: number;
  /** Giảm trừ chi phí y tế + giáo dục quy về tháng */
  specialDeduction: number;
  specialDeductionBreakdown: {
    medical: number;
    education: number;
  };
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
