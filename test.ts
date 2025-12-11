import { OLD_CONFIG, calculateComparison, calculateBHXH, BHXH_MAX_CAP, REGIONAL_MIN_WAGE, INSURANCE_RATES, EMPLOYER_RATES } from './utils/taxCalculator.ts';
import assert from 'assert';

// We'll evaluate multiple cases. Each case can optionally provide an explicit
// socialHealthBase to override the default (min(gross, BHXH_MAX_CAP)). If null,
// we'll compute the social/health base from gross and apply caps.
type TestCase = {
	name?: string;
	gross: number;
	dependents: number;
	region: 'I' | 'II' | 'III' | 'IV';
	// Optional: explicit social/health insurance base (may be used to model
	// custom contribution bases). If undefined or null, derive from gross.
	socialHealthBase?: number | null;
};

const cases: TestCase[] = [
	{ name: 'Default Region I (cap applied)', gross: 100_000_000, dependents: 0, region: 'I' },
	{ name: 'Fixed socialHealthBase small', gross: 100_000_000, dependents: 0, region: 'I', socialHealthBase: 10_000_000 },
	{ name: 'Fixed socialHealthBase above cap (use override)', gross: 100_000_000, dependents: 0, region: 'I', socialHealthBase: 100_000_000 },
	{ name: 'Different region (II) with 1 dependent', gross: 100_000_000, dependents: 1, region: 'II' },
];

// Expected values for each case. Must be granular to follow the exact printed outputs.
type Expected = {
	employeeInsurance: { bhxh: number; bhyt: number; bhtn: number; total: number };
	incomeBeforeTax: number;
	taxableIncome: number;
	personalTaxBreakdown: { rate: number; amount: number; tax: number }[];
	personalTax: number;
	netIncome: number;
	employerInsurance: { bhxh: number; bhyt: number; bhtn: number; accident: number };
	employerTotal: number;
	programmaticOldNet: number;
	programmaticNewNet: number;
	programmaticInsuranceUsingGross: number;
	programmaticInsuranceUsingProvided?: number;
};

const EXPECTED: Record<string, Expected> = {
	'Default Region I (cap applied)': {
		employeeInsurance: { bhxh: 3_744_000, bhyt: 702_000, bhtn: 992_000, total: 5_438_000 },
		incomeBeforeTax: 94_562_000,
		taxableIncome: 83_562_000,
		personalTaxBreakdown: [
			{ rate: 5, amount: 5_000_000, tax: 250_000 },
			{ rate: 10, amount: 5_000_000, tax: 500_000 },
			{ rate: 15, amount: 8_000_000, tax: 1_200_000 },
			{ rate: 20, amount: 14_000_000, tax: 2_800_000 },
			{ rate: 25, amount: 20_000_000, tax: 5_000_000 },
			{ rate: 30, amount: 28_000_000, tax: 8_400_000 },
			{ rate: 35, amount: 3_562_000, tax: 1_246_700 },
		],
		personalTax: 19_396_700,
		netIncome: 75_165_300,
		employerInsurance: { bhxh: 7_956_000, bhyt: 1_404_000, bhtn: 992_000, accident: 234_000 },
		employerTotal: 110_586_000,
		programmaticOldNet: 75_165_300,
		programmaticNewNet: 80_343_400,
		programmaticInsuranceUsingGross: 5_438_000,
	},
	'Fixed socialHealthBase small': {
		employeeInsurance: { bhxh: 800_000, bhyt: 150_000, bhtn: 992_000, total: 1_942_000 },
		incomeBeforeTax: 98_058_000,
		taxableIncome: 87_058_000,
		personalTaxBreakdown: [
			{ rate: 5, amount: 5_000_000, tax: 250_000 },
			{ rate: 10, amount: 5_000_000, tax: 500_000 },
			{ rate: 15, amount: 8_000_000, tax: 1_200_000 },
			{ rate: 20, amount: 14_000_000, tax: 2_800_000 },
			{ rate: 25, amount: 20_000_000, tax: 5_000_000 },
			{ rate: 30, amount: 28_000_000, tax: 8_400_000 },
			{ rate: 35, amount: 7_058_000, tax: 2_470_300 },
		],
		personalTax: 20_620_300,
		netIncome: 77_437_700,
		employerInsurance: { bhxh: 1_700_000, bhyt: 300_000, bhtn: 992_000, accident: 50_000 },
		employerTotal: 103_042_000,
		programmaticOldNet: 78_017_500,
		programmaticNewNet: 83_415_000,
		programmaticInsuranceUsingGross: 5_438_000,
		programmaticInsuranceUsingProvided: 1_050_000,
	},
	'Fixed socialHealthBase above cap (use override)': {
		employeeInsurance: { bhxh: 3_744_000, bhyt: 702_000, bhtn: 992_000, total: 5_438_000 },
		incomeBeforeTax: 94_562_000,
		taxableIncome: 83_562_000,
		personalTaxBreakdown: [
			{ rate: 5, amount: 5_000_000, tax: 250_000 },
			{ rate: 10, amount: 5_000_000, tax: 500_000 },
			{ rate: 15, amount: 8_000_000, tax: 1_200_000 },
			{ rate: 20, amount: 14_000_000, tax: 2_800_000 },
			{ rate: 25, amount: 20_000_000, tax: 5_000_000 },
			{ rate: 30, amount: 28_000_000, tax: 8_400_000 },
			{ rate: 35, amount: 3_562_000, tax: 1_246_700 },
		],
		personalTax: 19_396_700,
		netIncome: 75_165_300,
		employerInsurance: { bhxh: 7_956_000, bhyt: 1_404_000, bhtn: 992_000, accident: 234_000 },
		employerTotal: 110_586_000,
		programmaticOldNet: 75_165_300,
		programmaticNewNet: 80_343_400,
		programmaticInsuranceUsingGross: 5_438_000,
		programmaticInsuranceUsingProvided: 5_438_000,
	},
	'Different region (II) with 1 dependent': {
		employeeInsurance: { bhxh: 3_744_000, bhyt: 702_000, bhtn: 832_000, total: 5_278_000 },
		incomeBeforeTax: 94_722_000,
		taxableIncome: 79_322_000,
		personalTaxBreakdown: [
			{ rate: 5, amount: 5_000_000, tax: 250_000 },
			{ rate: 10, amount: 5_000_000, tax: 500_000 },
			{ rate: 15, amount: 8_000_000, tax: 1_200_000 },
			{ rate: 20, amount: 14_000_000, tax: 2_800_000 },
			{ rate: 25, amount: 20_000_000, tax: 5_000_000 },
			{ rate: 30, amount: 27_322_000, tax: 8_196_600 },
		],
		personalTax: 17_946_600,
		netIncome: 76_775_400,
		employerInsurance: { bhxh: 7_956_000, bhyt: 1_404_000, bhtn: 832_000, accident: 234_000 },
		employerTotal: 110_426_000,
		programmaticOldNet: 76_775_400,
		programmaticNewNet: 82_315_400,
		programmaticInsuranceUsingGross: 5_278_000,
	},
};

const format = (value: number) => value.toLocaleString('vi-VN');

// We'll iterate cases and compute values per-case below.

// Utility to compute per-case breakdown (mirrors logic in taxCalculator)
const computeManualInsurance = (gross: number, region: TestCase['region'], socialHealthBase: number) => {
	// Cap social/health base at BHXH_MAX_CAP to match calculator logic
	const socialBase = Math.min(socialHealthBase, BHXH_MAX_CAP);
	const unemploymentBase = Math.min(gross, 20 * REGIONAL_MIN_WAGE[region]);
	return {
		socialBase,
		unemploymentBase,
		bhxh: socialBase * INSURANCE_RATES.bhxh,
		bhyt: socialBase * INSURANCE_RATES.bhyt,
		bhtn: unemploymentBase * INSURANCE_RATES.bhtn,
	};
};

const bracketLabels = [
	'Đến 5 triệu VNĐ',
	'Trên 5 triệu VNĐ đến 10 triệu VNĐ',
	'Trên 10 triệu VNĐ đến 18 triệu VNĐ',
	'Trên 18 triệu VNĐ đến 32 triệu VNĐ',
	'Trên 32 triệu VNĐ đến 52 triệu VNĐ',
	'Trên 52 triệu VNĐ đến 80 triệu VNĐ',
	'Trên 80 triệu VNĐ',
];

// Helper to log a single case's details.
function logCase(c: TestCase) {
	console.log('\n=====================');
	console.log(`Case: ${c.name ?? `${c.region} - ${c.gross} VND`}`);
	console.log('=====================');

	const gross = c.gross;
	const dependents = c.dependents;
	const region = c.region;

	// Derive socialHealthBase when not explicitly set
	const derivedSocialHealthBase = Math.min(gross, BHXH_MAX_CAP);
	const socialHealthBaseInput = c.socialHealthBase ?? derivedSocialHealthBase;
	const socialHealthBaseUsed = Math.min(socialHealthBaseInput, BHXH_MAX_CAP);

	const insurance = computeManualInsurance(gross, region, socialHealthBaseInput);
	const employeeInsuranceTotal = insurance.bhxh + insurance.bhyt + insurance.bhtn;
	const incomeBeforeTax = gross - employeeInsuranceTotal;
	const taxableIncome = incomeBeforeTax - OLD_CONFIG.personalDeduction - dependents * OLD_CONFIG.dependentDeduction;

	const personalTaxBreakdown = OLD_CONFIG.brackets.map((bracket, index) => {
		const lower = bracket.min;
		const upper = bracket.max ?? Number.POSITIVE_INFINITY;
		const taxableMillions = Math.max(0, taxableIncome / 1_000_000);
		const amountInBracket = Math.max(0, Math.min(taxableMillions, upper) - lower);
		const tax = amountInBracket * (bracket.rate / 100) * 1_000_000;
		return {
			label: bracketLabels[index],
			rate: bracket.rate,
			amount: amountInBracket * 1_000_000,
			tax,
		};
	});

	const personalTax = personalTaxBreakdown.reduce((sum, item) => sum + item.tax, 0);
	const netIncome = incomeBeforeTax - personalTax;

	const employerInsurance = {
		bhxh: insurance.socialBase * EMPLOYER_RATES.bhxh,
		bhyt: insurance.socialBase * EMPLOYER_RATES.bhyt,
		bhtn: insurance.unemploymentBase * EMPLOYER_RATES.bhtn,
		accident: insurance.socialBase * EMPLOYER_RATES.bhtnld_bnn,
	};

	const employerTotal = gross + employerInsurance.bhxh + employerInsurance.accident + employerInsurance.bhyt + employerInsurance.bhtn;

	const logRow = (label: string, value: number, prefix = '') => {
		console.log(`${label.padEnd(45, ' ')}${prefix}${format(Math.round(value))}`);
	};

	console.log('Diễn giải chi tiết (VNĐ)');
	logRow('Lương GROSS', gross);
	logRow('Mức tính BHXH/BHYT (dùng)', insurance.socialBase);
	if (socialHealthBaseInput > BHXH_MAX_CAP) {
		console.log(`  (Cảnh báo: giá trị nhập ${format(Math.round(socialHealthBaseInput))} vượt quá mức tối đa ${format(Math.round(BHXH_MAX_CAP))} nên sẽ bị lấy là ${format(Math.round(insurance.socialBase))})`);
	}
	logRow('Bảo hiểm xã hội (8%)', insurance.bhxh, '- ');
	logRow('Bảo hiểm y tế (1.5%)', insurance.bhyt, '- ');
	logRow('Bảo hiểm thất nghiệp (1%)', insurance.bhtn, '- ');
	logRow('Thu nhập trước thuế', incomeBeforeTax);
	logRow('Giảm trừ gia cảnh bản thân', OLD_CONFIG.personalDeduction, '- ');
	logRow('Giảm trừ gia cảnh người phụ thuộc', dependents * OLD_CONFIG.dependentDeduction, '- ');
	logRow('Thu nhập chịu thuế', taxableIncome);
	logRow('Thuế thu nhập cá nhân(*)', personalTax, '- ');
	logRow('Lương NET (Thu nhập trước thuế - Thuế thu nhập cá nhân.)', netIncome);

	console.log('\n(*) Chi tiết thuế thu nhập cá nhân (VNĐ)');
	console.log('Mức chịu thuế'.padEnd(45, ' ') + 'Thuế suất\tTiền nộp');
	personalTaxBreakdown.forEach((item) => {
		if (item.amount > 0) {
			console.log(`${item.label.padEnd(45, ' ')}${item.rate}%\t${format(Math.round(item.tax))}`);
		}
	});

	console.log('\nNgười sử dụng lao động trả (VNĐ)');
	logRow('Lương GROSS', gross);
	logRow('Bảo hiểm xã hội (17%)', employerInsurance.bhxh);
	logRow('Bảo hiểm Tai nạn lao động - Bệnh nghề nghiệp (0.5%)', employerInsurance.accident);
	logRow('Bảo hiểm y tế (3%)', employerInsurance.bhyt);
	logRow('Bảo hiểm thất nghiệp (1%)', employerInsurance.bhtn);
	logRow('Tổng cộng', employerTotal);

	// Also verify programmatic calculator result & insurance totals
	const customInsuranceSalary = c.socialHealthBase ?? null;
	const calcResult = calculateComparison(gross, dependents, region, customInsuranceSalary);
	// Programmatic insurance total when using gross as base
	const programmaticInsuranceWithGross = calculateBHXH(gross, region);
	// Programmatic insurance total if we pass a custom insurance salary
	const programmaticInsuranceWithCustom = customInsuranceSalary === null ? programmaticInsuranceWithGross : calculateBHXH(customInsuranceSalary, region);
	console.log('\nProgrammatic calculateComparison results:');
	console.log('OLD NET:', calcResult.oldReg.netIncome.toLocaleString('vi-VN'));
	console.log('NEW NET:', calcResult.newReg.netIncome.toLocaleString('vi-VN'));
	console.log('Programmatic insurance (using gross):', programmaticInsuranceWithGross.toLocaleString('vi-VN'));
	if (customInsuranceSalary !== null) {
		console.log('Programmatic insurance (using provided base):', programmaticInsuranceWithCustom.toLocaleString('vi-VN'));
	}
	// Show outputs for each region to compare using calc
	(['I', 'II', 'III', 'IV'] as const).forEach((r) => {
		const res = calculateComparison(gross, dependents, r, customInsuranceSalary);
		console.log(`Region ${r} - OLD NET: ${res.oldReg.netIncome.toLocaleString('vi-VN')}, NEW NET: ${res.newReg.netIncome.toLocaleString('vi-VN')}`);
	});
}

// Run cases
cases.forEach(logCase);

// Now run assertions for each case and compare to EXPECTED values
cases.forEach((c) => {
	const key = c.name ?? `${c.region} - ${c.gross} VND`;
	const expected = EXPECTED[key];
	if (!expected) {
		console.log(`No EXPECTED entry for case ${key}, skipping assertions.`);
		return;
	}

	// Compute manual values the same as above
	const gross = c.gross;
	const dependents = c.dependents;
	const region = c.region;
	const derivedSocialHealthBase = Math.min(gross, BHXH_MAX_CAP);
	const socialHealthBaseInput = c.socialHealthBase ?? derivedSocialHealthBase;
	const insurance = computeManualInsurance(gross, region, socialHealthBaseInput);
	const employeeInsuranceTotal = insurance.bhxh + insurance.bhyt + insurance.bhtn;
	const incomeBeforeTax = gross - employeeInsuranceTotal;
	const taxableIncome = incomeBeforeTax - OLD_CONFIG.personalDeduction - dependents * OLD_CONFIG.dependentDeduction;
	const personalTaxBreakdown = OLD_CONFIG.brackets.map((bracket, index) => {
		const lower = bracket.min;
		const upper = bracket.max ?? Number.POSITIVE_INFINITY;
		const taxableMillions = Math.max(0, taxableIncome / 1_000_000);
		const amountInBracket = Math.max(0, Math.min(taxableMillions, upper) - lower);
		const tax = amountInBracket * (bracket.rate / 100) * 1_000_000;
		return { rate: bracket.rate, amount: amountInBracket * 1_000_000, tax };
	}).filter((p) => p.amount > 0);
	const personalTax = personalTaxBreakdown.reduce((s, i) => s + i.tax, 0);
	const netIncome = incomeBeforeTax - personalTax;
	const employerInsurance = {
		bhxh: insurance.socialBase * EMPLOYER_RATES.bhxh,
		bhyt: insurance.socialBase * EMPLOYER_RATES.bhyt,
		bhtn: insurance.unemploymentBase * EMPLOYER_RATES.bhtn,
		accident: insurance.socialBase * EMPLOYER_RATES.bhtnld_bnn,
	};
	const employerTotal = gross + employerInsurance.bhxh + employerInsurance.accident + employerInsurance.bhyt + employerInsurance.bhtn;
	const programmaticOldNet = calculateComparison(gross, dependents, region, c.socialHealthBase ?? null).oldReg.netIncome;
	const programmaticNewNet = calculateComparison(gross, dependents, region, c.socialHealthBase ?? null).newReg.netIncome;
	const programmaticInsuranceUsingGross = calculateBHXH(gross, region);
	const programmaticInsuranceUsingProvided = c.socialHealthBase === undefined || c.socialHealthBase === null ? programmaticInsuranceUsingGross : calculateBHXH(c.socialHealthBase, region);

	try {
		assert.strictEqual(Math.round(insurance.bhxh), expected.employeeInsurance.bhxh, `${key} bhxh`);
		assert.strictEqual(Math.round(insurance.bhyt), expected.employeeInsurance.bhyt, `${key} bhyt`);
		assert.strictEqual(Math.round(insurance.bhtn), expected.employeeInsurance.bhtn, `${key} bhtn`);
		assert.strictEqual(Math.round(employeeInsuranceTotal), expected.employeeInsurance.total, `${key} employeeInsurance.total`);
		assert.strictEqual(Math.round(incomeBeforeTax), expected.incomeBeforeTax, `${key} incomeBeforeTax`);
		assert.strictEqual(Math.round(taxableIncome), expected.taxableIncome, `${key} taxableIncome`);
		assert.strictEqual(Math.round(personalTax), expected.personalTax, `${key} personalTax`);
		assert.strictEqual(Math.round(netIncome), expected.netIncome, `${key} netIncome`);
		assert.strictEqual(Math.round(employerInsurance.bhxh), expected.employerInsurance.bhxh, `${key} employer bhxh`);
		assert.strictEqual(Math.round(employerInsurance.bhyt), expected.employerInsurance.bhyt, `${key} employer bhyt`);
		assert.strictEqual(Math.round(employerInsurance.bhtn), expected.employerInsurance.bhtn, `${key} employer bhtn`);
		assert.strictEqual(Math.round(employerInsurance.accident), expected.employerInsurance.accident, `${key} employer accident`);
		assert.strictEqual(Math.round(employerTotal), expected.employerTotal, `${key} employerTotal`);
		assert.strictEqual(programmaticOldNet, expected.programmaticOldNet, `${key} programmaticOldNet`);
		assert.strictEqual(programmaticNewNet, expected.programmaticNewNet, `${key} programmaticNewNet`);
		assert.strictEqual(programmaticInsuranceUsingGross, expected.programmaticInsuranceUsingGross, `${key} programmaticInsuranceUsingGross`);
		if (expected.programmaticInsuranceUsingProvided !== undefined) {
			assert.strictEqual(programmaticInsuranceUsingProvided, expected.programmaticInsuranceUsingProvided, `${key} programmaticInsuranceUsingProvided`);
		}
		// Compare breakdowns (rates and taxes for each computed level)
		assert.strictEqual(personalTaxBreakdown.length, expected.personalTaxBreakdown.length, `${key} breakdown length`);
		for (let i = 0; i < personalTaxBreakdown.length; i++) {
			const got = personalTaxBreakdown[i];
			const exp = expected.personalTaxBreakdown[i];
			assert.strictEqual(got.rate, exp.rate, `${key} breakdown[${i}].rate`);
			assert.strictEqual(Math.round(got.amount), exp.amount, `${key} breakdown[${i}].amount`);
			assert.strictEqual(Math.round(got.tax), exp.tax, `${key} breakdown[${i}].tax`);
		}
		console.log(`✓ ${key} - assertions passed`);
	} catch (e) {
		console.error(`✗ Assertion failed for case ${key}:`, e.message);
		throw e;
	}
});