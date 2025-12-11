import { OLD_CONFIG, calculateComparison, calculateBHXH } from './utils/taxCalculator.ts';

const gross = 100_000_000;
const dependents = 0;

// Caps and rates reflect the target output numbers for 100,000,000 VND salary in Region I.
const SOCIAL_HEALTH_CAP = 46_800_000; // Used for BHXH/BHYT (20 x 2,340,000 base)
const UNEMPLOYMENT_CAP = 99_200_000; // Used for BHTN (20 x 4,960,000 regional min wage)

const format = (value: number) => value.toLocaleString('vi-VN');

const socialHealthBase = Math.min(gross, SOCIAL_HEALTH_CAP);
const unemploymentBase = Math.min(gross, UNEMPLOYMENT_CAP);

const employeeInsurance = {
	bhxh: socialHealthBase * 0.08,
	bhyt: socialHealthBase * 0.015,
	bhtn: unemploymentBase * 0.01,
};

const employeeInsuranceTotal = employeeInsurance.bhxh + employeeInsurance.bhyt + employeeInsurance.bhtn;
const incomeBeforeTax = gross - employeeInsuranceTotal;
const taxableIncome = incomeBeforeTax - OLD_CONFIG.personalDeduction - dependents * OLD_CONFIG.dependentDeduction;

const bracketLabels = [
	'Đến 5 triệu VNĐ',
	'Trên 5 triệu VNĐ đến 10 triệu VNĐ',
	'Trên 10 triệu VNĐ đến 18 triệu VNĐ',
	'Trên 18 triệu VNĐ đến 32 triệu VNĐ',
	'Trên 32 triệu VNĐ đến 52 triệu VNĐ',
	'Trên 52 triệu VNĐ đến 80 triệu VNĐ',
	'Trên 80 triệu VNĐ',
];

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
	bhxh: socialHealthBase * 0.17,
	bhyt: socialHealthBase * 0.03,
	bhtn: unemploymentBase * 0.01,
	accident: socialHealthBase * 0.005,
};

const employerTotal = gross + employerInsurance.bhxh + employerInsurance.accident + employerInsurance.bhyt + employerInsurance.bhtn;

const logRow = (label: string, value: number, prefix = '') => {
	console.log(`${label.padEnd(45, ' ')}${prefix}${format(Math.round(value))}`);
};

console.log('Diễn giải chi tiết (VNĐ)');
logRow('Lương GROSS', gross);
logRow('Bảo hiểm xã hội (8%)', employeeInsurance.bhxh, '- ');
logRow('Bảo hiểm y tế (1.5%)', employeeInsurance.bhyt, '- ');
logRow('Bảo hiểm thất nghiệp (1%)', employeeInsurance.bhtn, '- ');
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

// Also verify programmatic calculator result
const calcResult = calculateComparison(gross, dependents, 'I', null);
console.log('\nProgrammatic calculateComparison results:');
console.log('OLD NET:', calcResult.oldReg.netIncome.toLocaleString('vi-VN'));
console.log('NEW NET:', calcResult.newReg.netIncome.toLocaleString('vi-VN'));

// Show outputs for each region to compare
(['I', 'II', 'III', 'IV'] as const).forEach((r) => {
	const res = calculateComparison(gross, dependents, r, null);
	console.log(`Region ${r} - OLD NET: ${res.oldReg.netIncome.toLocaleString('vi-VN')}, NEW NET: ${res.newReg.netIncome.toLocaleString('vi-VN')}`);
});