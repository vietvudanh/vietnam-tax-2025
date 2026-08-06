import {
  TaxConfig,
  TaxResult,
  ComparisonResult,
  Region,
  BASE_SALARY_2024,
  InsuranceBreakdown,
  REGIONAL_MIN_WAGE_CURRENT,
  REGIONAL_MIN_WAGE_2026,
  REGIONAL_MIN_WAGE_2027_DRAFT,
  ExtraIncomeInput,
  EMPTY_EXTRA_INCOME,
  MEAL_ALLOWANCE_CAP_OLD,
  MEAL_ALLOWANCE_CAP_NEW,
  MEDICAL_DEDUCTION_CAP_YEAR,
  EDUCATION_DEDUCTION_CAP_YEAR,
  PeriodSpec,
  MONTHLY_PERIOD,
  MONTHS_PER_YEAR,
  AnnualInput,
  AnnualTaxResult,
  AnnualComparisonResult,
  MonthlyLine,
  NetGrossMode,
  NetGrossComparisonResult
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

// Tỷ lệ đóng bảo hiểm phần người lao động. Đây là NGUỒN DUY NHẤT - phép tính bên dưới
// đọc trực tiếp từ đây thay vì lặp lại số, tránh sửa một nơi mà nơi kia vẫn số cũ.
export const INSURANCE_RATES = {
  bhxh: 0.08,
  bhyt: 0.015,
  bhtn: 0.01,
  total: 0.105
};

const calculateInsurance = (
  insuranceSalary: number,
  region: Region,
  regionalMinWage?: number
): InsuranceBreakdown => {
  // Trần đóng BHXH/BHYT: 20 x mức tham chiếu. Đây là trần THÁNG.
  const socialHealthCap = 20 * BASE_SALARY_2024;

  // Use provided regionalMinWage or look up from current rates
  const minWage = regionalMinWage ?? REGIONAL_MIN_WAGE_CURRENT[region];
  const unemploymentCap = 20 * minWage; // 20 x Regional Min Wage

  // Căn cứ đóng đã áp trần - trả ra ngoài để bảng đóng góp của người sử dụng lao động
  // dùng đúng mức này thay vì tự suy ra từ lương gross.
  const socialHealthBase = Math.min(insuranceSalary, socialHealthCap);
  const unemploymentBase = Math.min(insuranceSalary, unemploymentCap);

  const social = socialHealthBase * INSURANCE_RATES.bhxh;
  const health = socialHealthBase * INSURANCE_RATES.bhyt;
  const unemployment = unemploymentBase * INSURANCE_RATES.bhtn;

  return {
    social,
    health,
    unemployment,
    total: social + health + unemployment,
    socialHealthBase,
    unemploymentBase,
  };
};

/**
 * Quy đổi một `TaxConfig` theo THÁNG sang kỳ tính thuế bất kỳ.
 *
 * Hàm lũy tiến từng phần là tuyến tính theo phép co giãn: nếu nhân cả mốc bậc thuế
 * lẫn thu nhập tính thuế với cùng một hệ số n thì tiền thuế cũng nhân đúng n lần.
 *   f(n·B)(n·x) = Σ (min(n·x, n·max) − n·min)⁺ · rate = n · f(B)(x)
 * Nhờ vậy kỳ năm dùng chung một vòng lặp bậc thuế với kỳ tháng, không cần bảng riêng.
 *
 * Lưu ý: `medicalDeductionCapYear` / `educationDeductionCapYear` vốn đã là trần NĂM
 * nên KHÔNG nhân ở đây - chúng được chia tỷ lệ riêng bằng `capRatio` bên dưới.
 */
const scaleConfigToPeriod = (config: TaxConfig, period: PeriodSpec): TaxConfig => {
  if (period.deductionMonths === 1 && period.incomeMonths === 1) return config;
  return {
    ...config,
    personalDeduction: config.personalDeduction * period.deductionMonths,
    dependentDeduction: config.dependentDeduction * period.deductionMonths,
    mealAllowanceCap: config.mealAllowanceCap * period.incomeMonths,
    brackets: config.brackets.map((b) => ({
      ...b,
      min: b.min * period.deductionMonths,
      max: b.max === null ? null : b.max * period.deductionMonths,
    })),
  };
};

const calculateTaxForConfig = (
  gross: number,
  dependents: number,
  insuranceDetails: InsuranceBreakdown,
  config: TaxConfig,
  extra: ExtraIncomeInput,
  period: PeriodSpec = MONTHLY_PERIOD
): TaxResult => {
  // Toàn bộ mốc bậc thuế và giảm trừ được quy về kỳ tính thuế ngay tại đây,
  // nên phần tính bên dưới không cần biết đang ở kỳ tháng hay kỳ năm.
  const scaled = scaleConfigToPeriod(config, period);

  const incomeBeforeTax = gross - insuranceDetails.total;

  // Thu nhập miễn thuế nằm trong lương gross:
  // - Tiền ăn giữa ca chỉ được miễn trong hạn mức, phần vượt vẫn chịu thuế
  // - Tiền làm thêm giờ / làm ban đêm được miễn toàn bộ theo quy định mới
  // Cả hai đều là khoản THÁNG nên nhân theo số tháng thực có thu nhập.
  const exemptMeal = Math.min(extra.mealAllowance * period.incomeMonths, scaled.mealAllowanceCap);
  const exemptOvertime = scaled.exemptOvertime ? extra.overtimePay * period.incomeMonths : 0;
  const exemptIncome = Math.min(incomeBeforeTax, exemptMeal + exemptOvertime);

  const totalDependentDeduction = dependents * scaled.dependentDeduction;

  // Trần chi phí y tế / giáo dục là theo NĂM. Kỳ tháng chỉ được hưởng 1/12,
  // kỳ năm được hưởng trọn (capRatio = 12/12 = 1).
  const capRatio = period.deductionMonths / MONTHS_PER_YEAR;
  const medicalDeduction = Math.min(extra.medicalExpensesYear, scaled.medicalDeductionCapYear) * capRatio;
  const educationDeduction = Math.min(extra.educationExpensesYear, scaled.educationDeductionCapYear) * capRatio;
  const specialDeduction = medicalDeduction + educationDeduction;

  const totalDeductions = scaled.personalDeduction + totalDependentDeduction + specialDeduction;

  const taxableIncome = Math.max(0, incomeBeforeTax - exemptIncome - totalDeductions);

  let totalTaxMillion = 0;
  const breakdown = [];

  for (let i = 0; i < scaled.brackets.length; i++) {
    const bracket = scaled.brackets[i];

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
    // Lấy thẳng căn cứ đóng đã áp trần từ calculateInsurance. Trước đây suy ra từ `gross`
    // nên khi người dùng chọn "Mức khác" thì bảng đóng góp của NSDLĐ bị sai.
    insuranceBase: insuranceDetails.socialHealthBase,
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
    personalDeduction: scaled.personalDeduction,
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

const MAX_GROSS_SEARCH = 10_000_000_000;
const SOLVER_ITERATIONS = 80;

type RegulationKey = 'oldReg' | 'newReg';

const findGrossForTargetNet = (
  targetNet: number,
  reg: RegulationKey,
  dependents: number,
  region: Region,
  customInsuranceSalary: number | null,
  personalDeduction: number,
  dependentDeduction: number,
  customRegionalMinWage?: number,
  extra: ExtraIncomeInput = EMPTY_EXTRA_INCOME
): number => {
  if (targetNet <= 0) return 0;

  const netAt = (gross: number): number => (
    calculateComparison(
      gross,
      dependents,
      region,
      customInsuranceSalary,
      personalDeduction,
      dependentDeduction,
      customRegionalMinWage,
      extra
    )[reg].netIncome
  );

  let low = 0;
  let high = Math.max(targetNet, 1_000_000);

  while (netAt(high) < targetNet && high < MAX_GROSS_SEARCH) {
    high *= 2;
  }

  if (high >= MAX_GROSS_SEARCH && netAt(high) < targetNet) {
    return MAX_GROSS_SEARCH;
  }

  for (let i = 0; i < SOLVER_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    if (netAt(mid) >= targetNet) {
      high = mid;
    } else {
      low = mid;
    }
  }

  const center = Math.max(0, Math.round(high));
  const candidates = [Math.max(0, Math.floor(high)), center, Math.ceil(high)];
  for (let delta = -3; delta <= 3; delta++) {
    candidates.push(Math.max(0, center + delta));
  }
  const uniqueCandidates = Array.from(new Set(candidates));

  let bestGross = uniqueCandidates[0];
  let bestNet = netAt(bestGross);

  for (const gross of uniqueCandidates.slice(1)) {
    const currentNet = netAt(gross);
    const bestReached = bestNet >= targetNet;
    const currentReached = currentNet >= targetNet;

    if (currentReached && !bestReached) {
      bestGross = gross;
      bestNet = currentNet;
      continue;
    }

    if (currentReached && bestReached) {
      if (gross < bestGross || (gross === bestGross && currentNet < bestNet)) {
        bestGross = gross;
        bestNet = currentNet;
      }
      continue;
    }

    if (!bestReached && Math.abs(currentNet - targetNet) < Math.abs(bestNet - targetNet)) {
      bestGross = gross;
      bestNet = currentNet;
    }
  }

  return bestGross;
};

export const calculateNetGrossComparison = (
  amount: number,
  mode: NetGrossMode,
  dependents: number,
  region: Region,
  customInsuranceSalary: number | null,
  personalDeduction: number,
  dependentDeduction: number,
  customRegionalMinWage?: number,
  extra: ExtraIncomeInput = EMPTY_EXTRA_INCOME
): NetGrossComparisonResult => {
  const inputAmount = Math.max(0, amount);

  if (mode === 'grossToNet') {
    const comparison = calculateComparison(
      inputAmount,
      dependents,
      region,
      customInsuranceSalary,
      personalDeduction,
      dependentDeduction,
      customRegionalMinWage,
      extra
    );

    return {
      mode,
      targetAmount: inputAmount,
      oldReg: {
        grossIncome: comparison.oldReg.grossIncome,
        netIncome: comparison.oldReg.netIncome,
        taxAmount: comparison.oldReg.taxAmount,
        insurance: comparison.oldReg.insurance,
      },
      newReg: {
        grossIncome: comparison.newReg.grossIncome,
        netIncome: comparison.newReg.netIncome,
        taxAmount: comparison.newReg.taxAmount,
        insurance: comparison.newReg.insurance,
      },
    };
  }

  const oldGross = findGrossForTargetNet(
    inputAmount,
    'oldReg',
    dependents,
    region,
    customInsuranceSalary,
    personalDeduction,
    dependentDeduction,
    customRegionalMinWage,
    extra
  );
  const oldComparison = calculateComparison(
    oldGross,
    dependents,
    region,
    customInsuranceSalary,
    personalDeduction,
    dependentDeduction,
    customRegionalMinWage,
    extra
  );

  const newGross = findGrossForTargetNet(
    inputAmount,
    'newReg',
    dependents,
    region,
    customInsuranceSalary,
    personalDeduction,
    dependentDeduction,
    customRegionalMinWage,
    extra
  );
  const newComparison = calculateComparison(
    newGross,
    dependents,
    region,
    customInsuranceSalary,
    personalDeduction,
    dependentDeduction,
    customRegionalMinWage,
    extra
  );

  return {
    mode,
    targetAmount: inputAmount,
    oldReg: {
      grossIncome: oldComparison.oldReg.grossIncome,
      netIncome: oldComparison.oldReg.netIncome,
      taxAmount: oldComparison.oldReg.taxAmount,
      insurance: oldComparison.oldReg.insurance,
    },
    newReg: {
      grossIncome: newComparison.newReg.grossIncome,
      netIncome: newComparison.newReg.netIncome,
      taxAmount: newComparison.newReg.taxAmount,
      insurance: newComparison.newReg.insurance,
    },
  };
};

/**
 * Quyết toán thuế TNCN cả năm cho MỘT bộ quy định.
 *
 * Hai phép tính chạy song song rồi so với nhau:
 *  1. Tạm khấu trừ hằng tháng - đúng như doanh nghiệp làm: mỗi tháng áp biểu thuế THÁNG
 *     lên thu nhập của riêng tháng đó. Tháng có thưởng Tết bị đẩy lên bậc thuế cao.
 *  2. Quyết toán năm - gộp cả năm rồi áp biểu thuế NĂM (biểu tháng × 12).
 *
 * Chênh lệch giữa hai con số chính là số thuế được HOÀN hoặc phải NỘP THÊM. Với lương đều
 * 12 tháng và không có khoản đặc biệt thì hai phép tính bằng nhau tuyệt đối (settlement = 0).
 */
export const calculateAnnual = (
  input: AnnualInput,
  config: TaxConfig,
  regionalMinWage?: number
): AnnualTaxResult => {
  const { monthlyGross, monthsWorked, bonuses, dependents, region, customInsuranceSalary, extra } = input;

  // Tạm khấu trừ hằng tháng chỉ tính các khoản gắn với tháng (ăn ca, làm thêm giờ).
  // Chi phí y tế / giáo dục là khoản quyết toán cuối năm, doanh nghiệp không khấu trừ
  // hằng tháng - đó là một nguồn hoàn thuế có thật.
  const monthlyExtra: ExtraIncomeInput = {
    mealAllowance: extra.mealAllowance,
    overtimePay: extra.overtimePay,
    medicalExpensesYear: 0,
    educationExpensesYear: 0,
  };

  const months: MonthlyLine[] = [];
  let totalGross = 0;
  let totalWithheld = 0;
  let sumSocial = 0;
  let sumHealth = 0;
  let sumUnemployment = 0;
  let sumSocialHealthBase = 0;
  let sumUnemploymentBase = 0;

  for (let m = 1; m <= MONTHS_PER_YEAR; m++) {
    const working = m <= monthsWorked;
    const salary = working ? monthlyGross : 0;

    let bonus = 0;
    let insurableBonus = 0;
    for (const b of bonuses) {
      if (b.month !== m) continue;
      bonus += b.amount;
      if (b.subjectToInsurance) insurableBonus += b.amount;
    }

    const gross = salary + bonus;

    // Căn cứ đóng bảo hiểm của tháng. Trần 20 × mức tham chiếu là trần THÁNG, nên phải
    // áp trần từng tháng rồi mới cộng - gộp cả năm rồi áp trần sẽ ra số khác khi
    // thu nhập các tháng không đều.
    const baseSalary = customInsuranceSalary !== null ? customInsuranceSalary : salary;
    const insuranceSalary = (working ? baseSalary : 0) + insurableBonus;
    const ins = calculateInsurance(insuranceSalary, region, regionalMinWage);

    const withheld = calculateTaxForConfig(
      gross,
      dependents,
      ins,
      config,
      working ? monthlyExtra : EMPTY_EXTRA_INCOME,
      MONTHLY_PERIOD
    ).taxAmount;

    months.push({ month: m, salary, bonus, gross, insurance: ins.total, withheldTax: withheld });

    totalGross += gross;
    totalWithheld += withheld;
    sumSocial += ins.social;
    sumHealth += ins.health;
    sumUnemployment += ins.unemployment;
    sumSocialHealthBase += ins.socialHealthBase;
    sumUnemploymentBase += ins.unemploymentBase;
  }

  const annualInsurance: InsuranceBreakdown = {
    social: sumSocial,
    health: sumHealth,
    unemployment: sumUnemployment,
    total: sumSocial + sumHealth + sumUnemployment,
    socialHealthBase: sumSocialHealthBase,
    unemploymentBase: sumUnemploymentBase,
  };

  // Giảm trừ bản thân luôn đủ 12 tháng khi quyết toán, kể cả khi không làm việc đủ năm
  // (điểm c.1.1 khoản 1 Điều 9 Thông tư 111/2013/TT-BTC). Trần ăn ca / làm thêm giờ thì
  // chỉ tính theo số tháng thực có thu nhập.
  const annual = calculateTaxForConfig(totalGross, dependents, annualInsurance, config, extra, {
    deductionMonths: MONTHS_PER_YEAR,
    incomeMonths: monthsWorked,
  });

  return {
    months,
    totalGross,
    totalInsurance: annualInsurance.total,
    annual,
    totalWithheld,
    settlement: annual.taxAmount - totalWithheld,
    netIncomeYear: annual.netIncome,
  };
};

/** Quyết toán năm cho cả hai bộ quy định, song song với `calculateComparison` của kỳ tháng. */
export const calculateAnnualComparison = (
  input: AnnualInput,
  personalDeduction: number,
  dependentDeduction: number,
  customRegionalMinWage?: number
): AnnualComparisonResult => {
  const oldTaxConfig: TaxConfig = { ...OLD_CONFIG, personalDeduction, dependentDeduction };
  const newTaxConfig: TaxConfig = { ...NEW_CONFIG, personalDeduction, dependentDeduction };

  const oldReg = calculateAnnual(input, oldTaxConfig, customRegionalMinWage);
  const newReg = calculateAnnual(input, newTaxConfig, customRegionalMinWage);

  return {
    oldReg,
    newReg,
    diffTax: newReg.annual.taxAmount - oldReg.annual.taxAmount,
    diffNet: newReg.netIncomeYear - oldReg.netIncomeYear,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Compatibility exports
// (INSURANCE_RATES được định nghĩa cùng chỗ với calculateInsurance ở trên)

export const LUONG_CO_BAN = BASE_SALARY_2024;

export const BHXH_MAX_CAP = 20 * BASE_SALARY_2024;

export const REGIONAL_MIN_WAGE = REGIONAL_MIN_WAGE_CURRENT;
export { REGIONAL_MIN_WAGE_CURRENT, REGIONAL_MIN_WAGE_2026, REGIONAL_MIN_WAGE_2027_DRAFT };

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
