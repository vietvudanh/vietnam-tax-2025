import React, { useEffect, useState } from 'react';
import { Calculator, Users, ShieldCheck } from 'lucide-react';
import { calculateBHXH, formatCurrency, BHXH_MAX_CAP } from '../utils/taxCalculator';

interface InputFormProps {
  onCalculate: (gross: number, dependents: number, insurance: number, region: 'I' | 'II' | 'III' | 'IV') => void;
  regionalMinWageMap: Record<'I' | 'II' | 'III' | 'IV', number>;
  minWageNote: string;
  useNewMinWage: boolean;
  onToggleNewMinWage: () => void;
}

export const InputForm: React.FC<InputFormProps> = ({ onCalculate, regionalMinWageMap, minWageNote, useNewMinWage, onToggleNewMinWage }) => {
  const [grossStr, setGrossStr] = useState<string>('100,000,000');
  const [dependents, setDependents] = useState<number>(0);
  const [insuranceStr, setInsuranceStr] = useState<string>('');
  const [autoInsurance, setAutoInsurance] = useState<boolean>(true);
  const [region, setRegion] = useState<'I' | 'II' | 'III' | 'IV'>('I');

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

  useEffect(() => {
    if (autoInsurance) {
      setInsuranceStr('');
    }
  }, [autoInsurance]);

  useEffect(() => {
    onCalculate(gross, dependents, customInsuranceSalaryToPass, region);
  }, [gross, dependents, customInsuranceSalaryToPass, region, onCalculate]);

  const handleGrossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned) || 0;
    setGrossStr(num.toLocaleString('vi-VN'));
  };

  const handleInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleaned = value.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned) || 0;
    setInsuranceStr(num.toLocaleString('vi-VN'));
    setAutoInsurance(false);
  };

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
        </div>

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

        {/* Region Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-600">Vùng lương tối thiểu</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{useNewMinWage ? 'Mới (từ 1/1/2026)' : 'Hiện hành'}</span>
              <button
                onClick={onToggleNewMinWage}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${useNewMinWage ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${useNewMinWage ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
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
          <p className="text-xs text-slate-400 mt-2">
            {minWageNote}
          </p>
        </div>
      </div>
    </div>
  );
};
