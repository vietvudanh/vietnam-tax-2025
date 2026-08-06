import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Calculator, Users } from 'lucide-react';
import { calculateNetGrossComparison, formatCurrency, NEW_CONFIG, OLD_CONFIG } from '../utils/taxCalculator';
import { MinWageSet, NetGrossMode } from '../types';

interface NetGrossConverterProps {
  regionalMinWageMap: Record<'I' | 'II' | 'III' | 'IV', number>;
  minWageNote: string;
  minWageSet: MinWageSet;
  minWageSetLabels: Record<MinWageSet, string>;
  onChangeMinWageSet: (set: MinWageSet) => void;
  useNewDeduction: boolean;
  onToggleDeduction: () => void;
}

const MIN_WAGE_SET_ORDER: MinWageSet[] = ['legacy', 'current2026', 'draft2027'];

const parseAmount = (value: string): number => parseFloat(value.replace(/[^0-9]/g, '')) || 0;

export const NetGrossConverter: React.FC<NetGrossConverterProps> = ({
  regionalMinWageMap,
  minWageNote,
  minWageSet,
  minWageSetLabels,
  onChangeMinWageSet,
  useNewDeduction,
  onToggleDeduction,
}) => {
  const [mode, setMode] = useState<NetGrossMode>('grossToNet');
  const [amountStr, setAmountStr] = useState<string>('30,000,000');
  const [dependents, setDependents] = useState<number>(0);
  const [region, setRegion] = useState<'I' | 'II' | 'III' | 'IV'>('I');

  const amount = parseAmount(amountStr);
  const personalDeduction = useNewDeduction ? NEW_CONFIG.personalDeduction : OLD_CONFIG.personalDeduction;
  const dependentDeduction = useNewDeduction ? NEW_CONFIG.dependentDeduction : OLD_CONFIG.dependentDeduction;

  const result = useMemo(() => (
    calculateNetGrossComparison(
      amount,
      mode,
      dependents,
      region,
      null,
      personalDeduction,
      dependentDeduction,
      regionalMinWageMap[region]
    )
  ), [amount, mode, dependents, region, personalDeduction, dependentDeduction, regionalMinWageMap]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(cleaned === '' ? '' : (parseInt(cleaned, 10) || 0).toLocaleString('vi-VN'));
  };

  const amountLabel = mode === 'grossToNet' ? 'Lương Gross cần quy đổi (VNĐ/tháng)' : 'Lương Net mục tiêu (VNĐ/tháng)';

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
        <ArrowLeftRight className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          Quy đổi hai chiều <strong>Gross → Net</strong> và <strong>Net → Gross</strong> theo cùng bộ quy định cũ/mới để so sánh nhanh.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-md border border-slate-100 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Quy đổi Net/Gross
          </h2>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100">
            <button
              onClick={() => setMode('grossToNet')}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${mode === 'grossToNet' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Gross → Net
            </button>
            <button
              onClick={() => setMode('netToGross')}
              className={`py-2 rounded-md text-sm font-medium transition-colors ${mode === 'netToGross' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Net → Gross
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">{amountLabel}</label>
            <div className="relative">
              <input
                type="text"
                value={amountStr}
                onChange={handleAmountChange}
                className="w-full pl-4 pr-14 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-slate-800"
                placeholder="0"
              />
              <span className="absolute right-4 top-3 text-slate-400 text-sm">VND</span>
            </div>
          </div>

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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDependents(Math.max(0, parseInt(e.target.value, 10) || 0))}
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

          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">Vùng lương tối thiểu</p>
            <div className="grid grid-cols-3 gap-1 p-1 mb-3 bg-slate-100 rounded-lg">
              {MIN_WAGE_SET_ORDER.map((set) => (
                <button
                  key={set}
                  onClick={() => onChangeMinWageSet(set)}
                  className={`text-xs font-medium py-1.5 px-2 rounded-md transition-colors ${
                    minWageSet === set ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
                    <div className="text-xs text-slate-500">{formatCurrency(regionalMinWageMap[r])}</div>
                  </div>
                  <input
                    type="radio"
                    name="region-net-gross"
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

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-blue-800">Áp dụng mức giảm trừ mới (từ 1/1/2026)</span>
              <button
                onClick={onToggleDeduction}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useNewDeduction ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useNewDeduction ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <p className="text-xs text-blue-700">
              Mức đang dùng: bản thân {formatCurrency(personalDeduction)} / người phụ thuộc {formatCurrency(dependentDeduction)}.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {mode === 'netToGross' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-900">
              Kết quả Gross là mức <strong>tối thiểu</strong> để đạt net mục tiêu.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-6">
              <div className="text-xs font-bold text-slate-500 mb-2">QUY ĐỊNH CŨ</div>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between"><span>Gross</span><span className="font-semibold">{formatCurrency(result.oldReg.grossIncome)}</span></div>
                <div className="flex justify-between"><span>Net</span><span className="font-semibold text-emerald-700">{formatCurrency(result.oldReg.netIncome)}</span></div>
                <div className="flex justify-between"><span>Bảo hiểm</span><span className="text-red-500">- {formatCurrency(result.oldReg.insurance)}</span></div>
                <div className="flex justify-between"><span>Thuế TNCN</span><span className="text-red-500">- {formatCurrency(result.oldReg.taxAmount)}</span></div>
              </div>
            </div>

            <div className="bg-white border-2 border-green-500 shadow-sm rounded-xl p-6">
              <div className="text-xs font-bold text-emerald-600 mb-2">MỚI (SAU 1/7/2026)</div>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between"><span>Gross</span><span className="font-semibold">{formatCurrency(result.newReg.grossIncome)}</span></div>
                <div className="flex justify-between"><span>Net</span><span className="font-semibold text-emerald-700">{formatCurrency(result.newReg.netIncome)}</span></div>
                <div className="flex justify-between"><span>Bảo hiểm</span><span className="text-red-500">- {formatCurrency(result.newReg.insurance)}</span></div>
                <div className="flex justify-between"><span>Thuế TNCN</span><span className="text-red-500">- {formatCurrency(result.newReg.taxAmount)}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Chênh lệch quy định mới so với cũ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex justify-between">
                <span>Chênh lệch Net</span>
                <span className="font-semibold">{formatCurrency(result.newReg.netIncome - result.oldReg.netIncome)}</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between">
                <span>Chênh lệch Gross</span>
                <span className="font-semibold">{formatCurrency(result.newReg.grossIncome - result.oldReg.grossIncome)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

