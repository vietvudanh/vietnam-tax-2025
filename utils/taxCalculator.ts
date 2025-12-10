import { TaxConfig, TaxResult, ComparisonResult } from '../types';

export const OLD_CONFIG: TaxConfig = {
  name: "Quy định cũ (Hiện hành)",
  effectiveDate: "Trước 1/7/2025",
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
  name: "Quy định mới (Đề xuất)",
  effectiveDate: "Sau 1/7/2025",
  personalDeduction: 15_500_000,
  dependentDeduction: 6_200_000,
  brackets: [
    { min: 0, max: 10, rate: 5, desc: "Nới rộng từ 5 triệu" },
    { min: 10, max: 30, rate: 15, desc: "Nới rộng khoảng cách" },
    { min: 30, max: 60, rate: 25, desc: "Nới rộng khoảng cách" },
    { min: 60, max: 100, rate: 30, desc: "Ngưỡng mới" },
    { min: 100, max: null, rate: 35, desc: "Tăng từ 80 triệu" },
  ],
};

const calculateTaxForConfig = (
  gross: number,
  dependents: number,
  insurance: number,
  config: TaxConfig
): TaxResult => {
  const incomeBeforeTax = gross - insurance;
  const totalDependentDeduction = dependents * config.dependentDeduction;
  const totalDeductions = config.personalDeduction + totalDependentDeduction;
  
  const taxableIncome = Math.max(0, incomeBeforeTax - totalDeductions);
  
  let remainingTaxable = taxableIncome / 1_000_000; // Convert to millions for bracket calculation
  let totalTaxMillion = 0;
  const breakdown = [];

  for (let i = 0; i < config.brackets.length; i++) {
    const bracket = config.brackets[i];
    const prevMax = i === 0 ? 0 : config.brackets[i-1].max || 0;
    
    // Calculate the span of this bracket
    // If max is null, it's infinity. 
    // The range of this bracket is (max - prevMax). If max is null, span is whatever remains.
    
    // However, a simpler way is to look at the brackets defined as ranges:
    // 0-5, 5-10, etc.
    
    const lowerBound = bracket.min;
    const upperBound = bracket.max;
    
    // Amount of income falling in this bracket
    // It is the overlap between [0, remainingTaxableInput] and [lowerBound, upperBound]
    // Actually, since we are iterating progressively, let's use the standard progressive logic.
    
    let amountInLevel = 0;
    
    if (upperBound === null) {
        // Last bracket
        amountInLevel = Math.max(0, (taxableIncome / 1_000_000) - lowerBound);
    } else {
        // Intermediate bracket
        // Logic: if taxable income > lowerBound, we take min(taxable, upper) - lower
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
    insurance,
    incomeBeforeTax,
    personalDeduction: config.personalDeduction,
    dependentDeduction: totalDependentDeduction,
    taxableIncome,
    taxAmount,
    netIncome: incomeBeforeTax - taxAmount,
    bracketsBreakdown: breakdown,
  };
};

export const calculateComparison = (
  gross: number,
  dependents: number,
  insurance: number
): ComparisonResult => {
  const oldReg = calculateTaxForConfig(gross, dependents, insurance, OLD_CONFIG);
  const newReg = calculateTaxForConfig(gross, dependents, insurance, NEW_CONFIG);

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