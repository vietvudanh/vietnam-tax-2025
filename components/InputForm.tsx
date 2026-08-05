import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Users, ShieldCheck, Utensils, Moon, HeartPulse, GraduationCap, CalendarDays, Gift, Plus, X } from 'lucide-react';
import { calculateBHXH, formatCurrency, BHXH_MAX_CAP } from '../utils/taxCalculator';
import {
  ExtraIncomeInput,
  MEAL_ALLOWANCE_CAP_NEW,
  MEDICAL_DEDUCTION_CAP_YEAR,
  EDUCATION_DEDUCTION_CAP_YEAR,
  MinWageSet,
  TaxPeriod,
  BonusEntry,
} from '../types';

interface InputFormProps {
  onCalculate: (
    gross: number,
    dependents: number,
    // null = đóng bảo hiểm theo toàn bộ lương gross
    insurance: number | null,
    region: 'I' | 'II' | 'III' | 'IV',
    extra: ExtraIncomeInput
  ) => void;
  regionalMinWageMap: Record<'I' | 'II' | 'III' | 'IV', number>;
  minWageNote: string;
  minWageSet: MinWageSet;
  minWageSetLabels: Record<MinWageSet, string>;
  onChangeMinWageSet: (set: MinWageSet) => void;
  period: TaxPeriod;
  monthsWorked: number;
  bonuses: BonusEntry[];
  onChangeMonthsWorked: (n: number) => void;
  onChangeBonuses: (next: BonusEntry[]) => void;
}

const parseAmount = (value: string): number => parseFloat(value.replace(/[^0-9]/g, '')) || 0;

const MIN_WAGE_SET_ORDER: MinWageSet[] = ['legacy', 'current2026', 'draft2027'];

/** 1..12 - dùng cho select số tháng làm việc và tháng chi trả thưởng */
const MONTH_OPTIONS: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Bộ đếm ở module scope: id ổn định, không phụ thuộc Date.now() hay index của mảng.
let bonusIdCounter = 0;
const nextBonusId = (): string => {
  bonusIdCounter += 1;
  return `bonus-${bonusIdCounter}`;
};

/** Hiển thị số tiền có dấu phân cách; giữ ô trống khi giá trị bằng 0 (không hiện số 0 thừa). */
const formatAmountValue = (amount: number): string =>
  amount === 0 ? '' : amount.toLocaleString('vi-VN');

export const InputForm: React.FC<InputFormProps> = ({
  onCalculate,
  regionalMinWageMap,
  minWageNote,
  minWageSet,
  minWageSetLabels,
  onChangeMinWageSet,
  period,
  monthsWorked,
  bonuses,
  onChangeMonthsWorked,
  onChangeBonuses,
}) => {
  const [grossStr, setGrossStr] = useState<string>('100,000,000');
  const [dependents, setDependents] = useState<number>(0);
  const [insuranceStr, setInsuranceStr] = useState<string>('');
  const [autoInsurance, setAutoInsurance] = useState<boolean>(true);
  const [region, setRegion] = useState<'I' | 'II' | 'III' | 'IV'>('I');
  const [mealStr, setMealStr] = useState<string>('');
  const [overtimeStr, setOvertimeStr] = useState<string>('');
  const [medicalStr, setMedicalStr] = useState<string>('');
  const [educationStr, setEducationStr] = useState<string>('');

  // Parse strings to numbers safely
  const gross = parseFloat(grossStr.replace(/[^0-9]/g, '')) || 0;
  const parsedInsuranceSalary = parseFloat(insuranceStr.replace(/[^0-9]/g, '')) || 0;
  const insuranceTotal = autoInsurance ? calculateBHXH(gross, region) : calculateBHXH(parsedInsuranceSalary, region);
  // When autoInsurance is false, we expect insurance input to be the SALARY BASE (capped amount) used for insurance calculation.
  // This is the actual salary subject to insurance (e.g., 46.8M cap), not the insurance total.
  const customInsuranceSalaryToPass = autoInsurance ? null : parsedInsuranceSalary;

  // Calculate the actual insurance salary base used - capped at 20 × mức tham chiếu (base salary)
  const insuranceSalary = autoInsurance ? gross : parsedInsuranceSalary;
  // Cap = 20 × mức tham chiếu (2,340,000₫) = 46,800,000₫
  const insuranceSalaryBase = Math.min(insuranceSalary, BHXH_MAX_CAP);

  const extra: ExtraIncomeInput = useMemo(() => ({
    mealAllowance: parseAmount(mealStr),
    overtimePay: parseAmount(overtimeStr),
    medicalExpensesYear: parseAmount(medicalStr),
    educationExpensesYear: parseAmount(educationStr),
  }), [mealStr, overtimeStr, medicalStr, educationStr]);

  useEffect(() => {
    if (autoInsurance) {
      setInsuranceStr('');
    }
  }, [autoInsurance]);

  useEffect(() => {
    onCalculate(gross, dependents, customInsuranceSalaryToPass, region, extra);
  }, [gross, dependents, customInsuranceSalaryToPass, region, extra, onCalculate]);

  const handleGrossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned) || 0;
    setGrossStr(num.toLocaleString('vi-VN'));
  };

  // Formats keystrokes into a thousands-separated amount, keeping an empty field empty.
  const handleAmountChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    setter(cleaned === '' ? '' : (parseInt(cleaned) || 0).toLocaleString('vi-VN'));
  };

  const handleInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned) || 0;
    setInsuranceStr(num.toLocaleString('vi-VN'));
    setAutoInsurance(false);
  };

  const handleMonthsWorkedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeMonthsWorked(parseInt(e.target.value, 10) || 1);
  };

  // Mọi thao tác trên danh sách thưởng đều tạo mảng mới - App nhận reference mới mới re-render.
  const updateBonus = (id: string, patch: Partial<BonusEntry>) => {
    onChangeBonuses(bonuses.map((b: BonusEntry) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const handleAddBonus = () => {
    onChangeBonuses([
      ...bonuses,
      { id: nextBonusId(), label: '', amount: 0, month: 12, subjectToInsurance: false },
    ]);
  };

  const handleRemoveBonus = (id: string) => {
    onChangeBonuses(bonuses.filter((b: BonusEntry) => b.id !== id));
  };

  const bonusTotal = bonuses.reduce((sum: number, b: BonusEntry) => sum + b.amount, 0);
  const yearTotalIncome = gross * monthsWorked + bonusTotal;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Calculator className="w-6 h-6 text-blue-600" />
        Nhập thông tin lương
      </h2>

      <div className="space-y-6">
        {/* Gross Income */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">
            Tổng thu nhập (Gross) / Tháng (VND)
          </label>
          <div className="relative">
            <input
              type="text"
              value={grossStr}
              onChange={handleGrossChange}
              className="w-full pl-4 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-slate-800"
              placeholder="e.g. 100,000,000"
            />
            <span className="absolute right-4 top-3 text-slate-400 text-sm">VND</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Lương tổng chưa trừ bảo hiểm và thuế</p>
          {period === 'year' && (
            <p className="text-xs text-slate-400 mt-1">
              Đây là mức lương tháng - áp dụng cho {monthsWorked} tháng làm việc
            </p>
          )}
        </div>

        {/* Quyết toán năm: số tháng làm việc + thưởng một lần */}
        {period === 'year' && (
          <div className="border-t border-slate-100 pt-5 space-y-5">
            {/* Số tháng làm việc */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Số tháng làm việc trong năm
              </label>
              <select
                value={monthsWorked}
                onChange={handleMonthsWorkedChange}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800 bg-white"
              >
                {MONTH_OPTIONS.map((m: number) => (
                  <option key={m} value={m}>
                    {m} tháng
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Khi quyết toán, cá nhân cư trú vẫn được giảm trừ bản thân đủ 12 tháng kể cả khi làm
                việc không đủ năm (điểm c.1.1 khoản 1 Điều 9 Thông tư 111/2013/TT-BTC).
              </p>
            </div>

            {/* Thưởng & thu nhập một lần */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Thưởng &amp; thu nhập một lần
              </label>

              {bonuses.length === 0 ? (
                <p className="text-xs text-slate-400 mb-3">
                  Chưa có khoản thưởng nào. Thêm thưởng Tết, lương tháng 13... để tính đúng thuế
                  tạm khấu trừ theo tháng.
                </p>
              ) : (
                <div className="space-y-3 mb-3">
                  {bonuses.map((bonus: BonusEntry) => (
                    <div
                      key={bonus.id}
                      className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={bonus.label}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateBonus(bonus.id, { label: e.target.value })
                          }
                          className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm text-slate-800 bg-white"
                          placeholder="Thưởng Tết"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBonus(bonus.id)}
                          aria-label="Xoá khoản thưởng"
                          title="Xoá khoản thưởng"
                          className="shrink-0 w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={formatAmountValue(bonus.amount)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const cleaned = e.target.value.replace(/[^0-9]/g, '');
                            updateBonus(bonus.id, {
                              amount: cleaned === '' ? 0 : parseInt(cleaned, 10) || 0,
                            });
                          }}
                          className="flex-1 min-w-0 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm text-slate-800 bg-white"
                          placeholder="0"
                        />
                        <select
                          value={bonus.month}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            updateBonus(bonus.id, { month: parseInt(e.target.value, 10) || 1 })
                          }
                          className="shrink-0 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm text-slate-800 bg-white"
                        >
                          {MONTH_OPTIONS.map((m: number) => (
                            <option key={m} value={m}>
                              T{m}
                            </option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bonus.subjectToInsurance}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateBonus(bonus.id, { subjectToInsurance: e.target.checked })
                          }
                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-600">Tính đóng BHXH</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddBonus}
                className="w-full py-2 border border-dashed border-blue-300 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Thêm khoản thưởng
              </button>

              <p className="text-xs text-slate-400 mt-1">
                Thưởng một lần thường không thuộc tiền lương tháng đóng BHXH bắt buộc (khoản 2 Điều
                30 Thông tư 59/2015/TT-BLĐTBXH).
              </p>
            </div>

            <p className="text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-3">
              → Tổng thu nhập năm: {formatCurrency(yearTotalIncome)}
            </p>
          </div>
        )}

        {/* Dependents */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Số người phụ thuộc
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDependents(Math.max(0, dependents - 1))}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xl flex items-center justify-center transition-colors"
            >
              -
            </button>
            <input
              type="number"
              value={dependents}
              onChange={(e) => setDependents(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 text-center py-2 border border-slate-300 rounded-lg font-semibold text-slate-800"
            />
            <button
              onClick={() => setDependents(dependents + 1)}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xl flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Insurance */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Mức đóng bảo hiểm: {formatCurrency(insuranceSalaryBase)}
          </label>

          <div className="space-y-3 mb-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="insuranceOption"
                checked={autoInsurance}
                onChange={() => setAutoInsurance(true)}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Đóng bảo hiểm theo toàn bộ lương (Trần = x20 lần lương vùng cơ bản)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="insuranceOption"
                checked={!autoInsurance}
                onChange={() => {
                  setAutoInsurance(false);
                  setInsuranceStr(''); // Clear input when choosing "Other"
                }}
                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">Mức khác</span>
            </label>
          </div>

          <div className="relative">
            <input
              type="text"
              value={insuranceStr}
              onChange={handleInsuranceChange}
              disabled={autoInsurance}
              className={`w-full pl-4 pr-4 py-3 border border-slate-300 rounded-lg transition-all font-medium text-slate-800 ${autoInsurance ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
              placeholder={autoInsurance ? '' : 'Nhập mức đóng bảo hiểm...'}
            />
            <span className="absolute right-4 top-3 text-slate-400 text-sm">VND</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {autoInsurance
              ? `Tổng BHXH+BHYT+BHTN (10.5%) sẽ được tính dựa trên mức này.`
              : `Nhập mức lương dùng để đóng bảo hiểm. Hệ thống sẽ tính 10.5% từ giá trị này.`
            }
          </p>
        </div>

        {/* Exemptions & new deductions - Nghị định 253/2026/NĐ-CP */}
        <div className="border-t border-slate-100 pt-5">
          <p className="text-sm font-semibold text-slate-700">Khoản miễn thuế & giảm trừ mới</p>
          <p className="text-xs text-slate-400 mb-4">
            Theo Nghị định 253/2026/NĐ-CP - chỉ áp dụng cho cột "Quy định mới"
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                Tiền ăn giữa ca / ăn trưa (VNĐ/tháng)
              </label>
              <input
                type="text"
                value={mealStr}
                onChange={handleAmountChange(setMealStr)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800"
                placeholder="0"
              />
              <p className="text-xs text-slate-400 mt-1">
                Miễn thuế tối đa {formatCurrency(MEAL_ALLOWANCE_CAP_NEW)}/tháng, phần vượt vẫn chịu thuế
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <Moon className="w-4 h-4" />
                Lương làm thêm giờ / ban đêm (VNĐ/tháng)
              </label>
              <input
                type="text"
                value={overtimeStr}
                onChange={handleAmountChange(setOvertimeStr)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800"
                placeholder="0"
              />
              <p className="text-xs text-slate-400 mt-1">
                Miễn toàn bộ thuế TNCN theo Điều 26 NĐ 253/2026/NĐ-CP (đã bao gồm trong lương gross)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <HeartPulse className="w-4 h-4" />
                Chi phí y tế trong năm (VNĐ/năm)
              </label>
              <input
                type="text"
                value={medicalStr}
                onChange={handleAmountChange(setMedicalStr)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800"
                placeholder="0"
              />
              <p className="text-xs text-slate-400 mt-1">
                Giảm trừ tối đa {formatCurrency(MEDICAL_DEDUCTION_CAP_YEAR)}/năm
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Chi phí giáo dục - đào tạo (VNĐ/năm)
              </label>
              <input
                type="text"
                value={educationStr}
                onChange={handleAmountChange(setEducationStr)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800"
                placeholder="0"
              />
              <p className="text-xs text-slate-400 mt-1">
                Giảm trừ tối đa {formatCurrency(EDUCATION_DEDUCTION_CAP_YEAR)}/năm
              </p>
            </div>
          </div>
        </div>

        {/* Region Selection */}
        <div>
          <p className="text-sm font-medium text-slate-600 mb-2">Vùng lương tối thiểu</p>
          <div className="grid grid-cols-3 gap-1 p-1 mb-3 bg-slate-100 rounded-lg">
            {MIN_WAGE_SET_ORDER.map((set) => (
              <button
                key={set}
                onClick={() => onChangeMinWageSet(set)}
                className={`text-xs font-medium py-1.5 px-2 rounded-md transition-colors ${
                  minWageSet === set
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {minWageSetLabels[set]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['I', 'II', 'III', 'IV'] as const).map((r) => (
              <label
                key={r}
                className={`border rounded-lg p-3 cursor-pointer flex items-center justify-between ${region === r ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div>
                  <div className="font-semibold text-slate-800">Vùng {r}</div>
                  <div className="text-xs text-slate-500">Mức tối thiểu: {formatCurrency(regionalMinWageMap[r])}</div>
                </div>
                <input
                  type="radio"
                  name="region"
                  value={r}
                  checked={region === r}
                  onChange={() => setRegion(r)}
                  className="w-4 h-4 text-blue-600 border-slate-300"
                />
              </label>
            ))}
          </div>
          <p
            className={`text-xs mt-2 ${
              minWageSet === 'draft2027'
                ? 'text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2'
                : 'text-slate-400'
            }`}
          >
            {minWageNote}
          </p>
        </div>
      </div>
    </div>
  );
};
