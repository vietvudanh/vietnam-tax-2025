import {
  TaxConfig,
  TaxResult,
  ComparisonResult,
  Region,
  BASE_SALARY_2024,
  InsuranceBreakdown,
  REGIONAL_MIN_WAGE_CURRENT,
  REGIONAL_MIN_WAGE_2026,
  ExtraIncomeInput,
  EMPTY_EXTRA_INCOME,
  MEAL_ALLOWANCE_CAP_OLD,
  MEAL_ALLOWANCE_CAP_NEW,
  MEDICAL_DEDUCTION_CAP_YEAR,
  EDUCATION_DEDUCTION_CAP_YEAR
} from '../types.ts';

export const OLD_CONFIG: TaxConfig = {
  name: "Quy định cũ (Hiện hành)",
  effectiveDate: "Trước 1/7/2026",
  mealAllowanceCap: MEAL_ALLOWANCE_CAP_OLD,
  exemptOvertime: false,
  medicalDeductionCapYear: 0,
  educationDeductionCapYear: 0,
  personalDeduction: 11_000_000,
  dependentDeduction: 4_400_000,
  brackets: [
    { min: 0, max: 5, rate: 5 },
    { min: 5, max: 10, rate: 10 },
    { min: 10, max: 18, rate: 15 },
    { min: 18, max: 32, rate: 20 },
    { min: 32, max: 52, rate: 25 },
    { min: 52, max: 80, rate: 30 },
    { min: 80, max: null, rate: 35 },
  ],
};

export const NEW_CONFIG: TaxConfig = {
  name: "Quy định mới (Luật Thuế TNCN 2025 + NĐ 253/2026/NĐ-CP)",
  effectiveDate: "Từ 1/7/2026",
  mealAllowanceCap: MEAL_ALLOWANCE_CAP_NEW,
  exemptOvertime: true,
  medicalDeductionCapYear: MEDICAL_DEDUCTION_CAP_YEAR,
  educationDeductionCapYear: EDUCATION_DEDUCTION_CAP_YEAR,
  personalDeduction: 15_500_000,
  dependentDeduction: 6_200_000,
  brackets: [
    { min: 0, max: 10, rate: 5, desc: "Nới rộng từ 5 triệu" },
    { min: 10, max: 30, rate: 10, desc: "Giảm thuế suất từ 15% xuống 10%" },
    { min: 30, max: 60, rate: 20, desc: "Giảm thuế suất từ 25% xuống 20%" },
    { min: 60, max: 100, rate: 30, desc: "Ngưỡng mới, giữ nguyên 30%" },
    { min: 100, max: null, rate: 35, desc: "Tăng ngưỡng chịu thuế cao nhất" },
  ],
};

const calculateInsurance = (
  insuranceSalary: number,
  region: Region,
  regionalMinWage?: number
): InsuranceBreakdown => {
  // Caps
  const socialHealthCap = 20 * BASE_SALARY_2024; // 20 x Base Salary

  // Use provided regionalMinWage or look up from current rates
  const minWage = regionalMinWage ?? REGIONAL_MIN_WAGE_CURRENT[region];
  const unemploymentCap = 20 * minWage; // 20 x Regional Min Wage

  // Social Insurance (BHXH): 8%
  const socialBase = Math.min(insuranceSalary, socialHealthCap);
  const social = socialBase * 0.08;

  // Health Insurance (BHYT): 1.5%
  const healthBase = Math.min(insuranceSalary, socialHealthCap);
  const health = healthBase * 0.015;

  // Unemployment Insurance (BHTN): 1%
  const unemploymentBase = Math.min(insuranceSalary, unemploymentCap);
  const unemployment = unemploymentBase * 0.01;

  return {
    social,
    health,
    unemployment,
    total: social + health + unemployment
  };
};

const calculateTaxForConfig = (
  gross: number,
  dependents: number,
  insuranceDetails: InsuranceBreakdown,
  config: TaxConfig,
  extra: ExtraIncomeInput
): TaxResult => {
  const incomeBeforeTax = gross - insuranceDetails.total;

  // Thu nhập miễn thuế nằm trong lương gross:
  // - Tiền ăn giữa ca chỉ được miễn trong hạn mức, phần vượt vẫn chịu thuế
  // - Tiền làm thêm giờ / làm ban đêm được miễn toàn bộ theo quy định mới
  const exemptMeal = Math.min(extra.mealAllowance, config.mealAllowanceCap);
  const exemptOvertime = config.exemptOvertime ? extra.overtimePay : 0;
  const exemptIncome = Math.min(incomeBeforeTax, exemptMeal + exemptOvertime);

  const totalDependentDeduction = dependents * config.dependentDeduction;

  // Giảm trừ chi phí y tế / giáo dục tính theo năm, quy đổi về tháng
  const medicalDeduction = Math.min(extra.medicalExpensesYear, config.medicalDeductionCapYear) / 12;
  const educationDeduction = Math.min(extra.educationExpensesYear, config.educationDeductionCapYear) / 12;
  const specialDeduction = medicalDeduction + educationDeduction;

  const totalDeductions = config.personalDeduction + totalDependentDeduction + specialDeduction;

  const taxableIncome = Math.max(0, incomeBeforeTax - exemptIncome - totalDeductions);

  let totalTaxMillion = 0;
  const breakdown = [];

  for (let i = 0; i < config.brackets.length; i++) {
    const bracket = config.brackets[i];

    const lowerBound = bracket.min;
    const upperBound = bracket.max;

    let amountInLevel = 0;

    if (upperBound === null) {
      // Last bracket
      amountInLevel = Math.max(0, (taxableIncome / 1_000_000) - lowerBound);
    } else {
      // Intermediate bracket
      if ((taxableIncome / 1_000_000) > lowerBound) {
        amountInLevel = Math.min((taxableIncome / 1_000_000), upperBound) - lowerBound;
      }
    }

    if (amountInLevel > 0) {
      const taxForLevel = amountInLevel * (bracket.rate / 100);
      totalTaxMillion += taxForLevel;
      breakdown.push({
        level: i + 1,
        amountInBracket: amountInLevel * 1_000_000,
        rate: bracket.rate,
        tax: taxForLevel * 1_000_000
      });
    }
  }

  const taxAmount = totalTaxMillion * 1_000_000;

  return {
    grossIncome: gross,
    insurance: insuranceDetails.total,
    insuranceBase: Math.min(gross, 20 * BASE_SALARY_2024),
    insuranceBreakdown: {
      bhxh: insuranceDetails.social,
      bhyt: insuranceDetails.health,
      bhtn: insuranceDetails.unemployment,
    },
    insuranceDetails,
    incomeBeforeTax,
    exemptIncome,
    exemptIncomeBreakdown: {
      meal: exemptMeal,
      overtime: exemptOvertime,
    },
    personalDeduction: config.personalDeduction,
    dependentDeduction: totalDependentDeduction,
    specialDeduction,
    specialDeductionBreakdown: {
      medical: medicalDeduction,
      education: educationDeduction,
    },
    taxableIncome,
    taxAmount,
    netIncome: incomeBeforeTax - taxAmount,
    bracketsBreakdown: breakdown,
  };
};

export const calculateComparison = (
  gross: number,
  dependents: number,
  region: Region,
  customInsuranceSalary: number | null, // If null, use gross
  personalDeduction: number,
  dependentDeduction: number,
  customRegionalMinWage?: number, // Optional override for min wage
  extra: ExtraIncomeInput = EMPTY_EXTRA_INCOME
): ComparisonResult => {
  const insuranceSalary = customInsuranceSalary !== null ? customInsuranceSalary : gross;

  // Insurance is usually the same for both old/new tax laws (unless social insurance laws change, 
  // but here we focus on Tax law changes). We assume insurance law stays constant for this sim.
  const insuranceDetails = calculateInsurance(insuranceSalary, region, customRegionalMinWage);

  // Old tax law config (7 brackets) with selected deduction values
  const oldTaxConfig: TaxConfig = {
    ...OLD_CONFIG,
    personalDeduction: personalDeduction,
    dependentDeduction: dependentDeduction,
  };

  // New tax law config (5 brackets) with selected deduction values
  const newTaxConfig: TaxConfig = {
    ...NEW_CONFIG,
    personalDeduction: personalDeduction,
    dependentDeduction: dependentDeduction,
  };

  const oldReg = calculateTaxForConfig(gross, dependents, insuranceDetails, oldTaxConfig, extra);
  const newReg = calculateTaxForConfig(gross, dependents, insuranceDetails, newTaxConfig, extra);

  return {
    oldReg,
    newReg,
    diffTax: newReg.taxAmount - oldReg.taxAmount,
    diffNet: newReg.netIncome - oldReg.netIncome,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Compatibility exports
export const INSURANCE_RATES = {
  bhxh: 0.08,
  bhyt: 0.015,
  bhtn: 0.01,
  total: 0.105
};

export const LUONG_CO_BAN = BASE_SALARY_2024;

export const BHXH_MAX_CAP = 20 * BASE_SALARY_2024;

export const REGIONAL_MIN_WAGE = REGIONAL_MIN_WAGE_CURRENT;
export { REGIONAL_MIN_WAGE_CURRENT, REGIONAL_MIN_WAGE_2026 };

export const calculateBHXH = (gross: number, region: Region): number => {
  return calculateInsurance(gross, region).total;
};

// Employer-side rates for contributions (BHXH, BHYT, BHTN, BHTNLĐ-BNN)
export const EMPLOYER_RATES = {
  bhxh: 0.17, // 17% employer contribution
  bhyt: 0.03, // 3% employer contribution
  bhtn: 0.01, // 1% employer contribution
  bhtnld_bnn: 0.005, // 0.5% accident and occupational disease
};
