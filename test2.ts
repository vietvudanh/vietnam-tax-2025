import assert from 'node:assert';
import { calculateComparison } from './utils/taxCalculator'; // Check this path is correct
import { Region } from './types'; // Check this path is correct

/**
 * Helper to verify currency values.
 * Rounds floating point results (e.g. 21116249.999999996) to nearest integer (21116250)
 * before comparing.
 */
function assertCurrency(actual: number, expected: number, label: string) {
  const actualRounded = Math.round(actual);
  if (actualRounded !== expected) {
    throw new Error(
      `${label} mismatch.\n   Expected: ${expected}\n   Actual:   ${actual} (Rounded: ${actualRounded})`
    );
  }
}

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
  } catch (error: any) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   ${error.message}`);
  }
}

console.log('--- Starting Salary Calculation Tests (Based on TopCV Logs) ---\n');

// ------------------------------------------------------------------
// TEST CASE 1 & 2
// Scenario: High Income (100M), Full Insurance on Gross, 0 Dependents
// Source: TopCV JSON Log 1 & 2
// ------------------------------------------------------------------
runTest('Scenario 1: Gross 100M, 0 Dependents, Region 1, Insurance on Gross', () => {
  const inputs = {
    gross: 100_000_000,
    dependents: 0,
    region: 'I' as Region,
    insuranceSalary: 100_000_000, // "trenChinhThuc"
  };

  const expected = {
    bhxh: 3_744_000,
    bhyt: 702_000,
    bhtn: 992_000,
    totalInsurance: 5_438_000,
    incomeBeforeTax: 94_562_000,
    taxableIncome: 83_562_000,
    tax: 19_396_700,
    net: 75_165_300
  };

  const result = calculateComparison(
    inputs.gross, 
    inputs.dependents, 
    inputs.region, 
    inputs.insuranceSalary
  );
  
  // Note: The logs confirm calculations match OLD_CONFIG logic
  const actual = result.oldReg;

  assertCurrency(actual.insuranceDetails.social, expected.bhxh, 'Social Insurance');
  assertCurrency(actual.insuranceDetails.health, expected.bhyt, 'Health Insurance');
  assertCurrency(actual.insuranceDetails.unemployment, expected.bhtn, 'Unemployment Insurance');
  assertCurrency(actual.insurance, expected.totalInsurance, 'Total Insurance');
  
  assertCurrency(actual.incomeBeforeTax, expected.incomeBeforeTax, 'Income Before Tax');
  assertCurrency(actual.taxableIncome, expected.taxableIncome, 'Taxable Income');
  assertCurrency(actual.taxAmount, expected.tax, 'Tax Amount');
  assertCurrency(actual.netIncome, expected.net, 'Net Income');
});

// ------------------------------------------------------------------
// TEST CASE 3
// Scenario: High Income (100M), Fixed Insurance Salary (5M), 0 Dependents
// Source: TopCV JSON Log 3
// ------------------------------------------------------------------
runTest('Scenario 2: Gross 100M, 0 Dependents, Region 1, Insurance Fixed 5M', () => {
  const inputs = {
    gross: 100_000_000,
    dependents: 0,
    region: 'I' as Region,
    insuranceSalary: 5_000_000, // "khac": 5,000,000
  };

  const expected = {
    bhxh: 400_000,  
    bhyt: 75_000,   
    bhtn: 50_000,   
    totalInsurance: 525_000,
    incomeBeforeTax: 99_475_000,
    taxableIncome: 88_475_000,
    tax: 21_116_250,
    net: 78_358_750
  };

  const result = calculateComparison(
    inputs.gross, 
    inputs.dependents, 
    inputs.region, 
    inputs.insuranceSalary
  );
  const actual = result.oldReg;

  assertCurrency(actual.insuranceDetails.social, expected.bhxh, 'BHXH');
  assertCurrency(actual.insuranceDetails.health, expected.bhyt, 'BHYT');
  assertCurrency(actual.insuranceDetails.unemployment, expected.bhtn, 'BHTN');
  assertCurrency(actual.insurance, expected.totalInsurance, 'Total Insurance');
  
  assertCurrency(actual.incomeBeforeTax, expected.incomeBeforeTax, 'Income Before Tax');
  assertCurrency(actual.taxableIncome, expected.taxableIncome, 'Taxable Income');
  assertCurrency(actual.taxAmount, expected.tax, 'Tax Amount');
  assertCurrency(actual.netIncome, expected.net, 'Net Income');
});

// ------------------------------------------------------------------
// TEST CASE 4
// Scenario: Medium Income (25M), Fixed Insurance Salary (8M), 2 Dependents
// Source: TopCV JSON Log 4
// ------------------------------------------------------------------
runTest('Scenario 3: Gross 25M, 2 Dependents, Region 1, Insurance Fixed 8M', () => {
  const inputs = {
    gross: 25_000_000,
    dependents: 2,
    region: 'I' as Region,
    insuranceSalary: 8_000_000, // "khac": 8,000,000
  };

  const expected = {
    totalInsurance: 840_000,     
    incomeBeforeTax: 24_160_000, 
    totalDeduction: 19_800_000,
    taxableIncome: 4_360_000,    
    tax: 218_000,                
    net: 23_942_000
  };

  const result = calculateComparison(
    inputs.gross, 
    inputs.dependents, 
    inputs.region, 
    inputs.insuranceSalary
  );
  const actual = result.oldReg;

  assertCurrency(actual.insurance, expected.totalInsurance, 'Total Insurance');
  assertCurrency(actual.incomeBeforeTax, expected.incomeBeforeTax, 'Income Before Tax');
  
  const actualTotalDeduction = actual.personalDeduction + actual.dependentDeduction;
  assertCurrency(actualTotalDeduction, expected.totalDeduction, 'Total Deductions');

  assertCurrency(actual.taxableIncome, expected.taxableIncome, 'Taxable Income');
  assertCurrency(actual.taxAmount, expected.tax, 'Tax Amount');
  assertCurrency(actual.netIncome, expected.net, 'Net Income');
});

console.log('\n--- Tests Completed ---');