import React, { useEffect, useState } from 'react';
import { Calculator, Users, ShieldCheck } from 'lucide-react';

interface InputFormProps {
  onCalculate: (gross: number, dependents: number, insurance: number) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ onCalculate }) => {
  const [grossStr, setGrossStr] = useState<string>('30000000');
  const [dependents, setDependents] = useState<number>(0);
  const [insuranceStr, setInsuranceStr] = useState<string>('');
  const [autoInsurance, setAutoInsurance] = useState<boolean>(true);

  // Parse strings to numbers safely
  const gross = parseFloat(grossStr.replace(/[^0-9.]/g, '')) || 0;
  const insurance = parseFloat(insuranceStr.replace(/[^0-9.]/g, '')) || 0;

  useEffect(() => {
    if (autoInsurance) {
      // 10.5% standard deduction estimate
      const estimated = gross * 0.105;
      setInsuranceStr(estimated.toString());
    }
  }, [gross, autoInsurance]);

  useEffect(() => {
    onCalculate(gross, dependents, insurance);
  }, [gross, dependents, insurance, onCalculate]);

  const handleGrossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGrossStr(e.target.value);
  };

  const handleInsuranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInsuranceStr(e.target.value);
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
              type="number"
              value={grossStr}
              onChange={handleGrossChange}
              className="w-full pl-4 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-semibold text-slate-800"
              placeholder="e.g. 30000000"
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
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Mức đóng bảo hiểm (10.5%)
            </label>
            <div className="flex items-center gap-2">
               <input 
                type="checkbox" 
                id="autoIns" 
                checked={autoInsurance} 
                onChange={(e) => setAutoInsurance(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="autoIns" className="text-xs text-slate-500 cursor-pointer">Tự động tính (10.5%)</label>
            </div>
          </div>
          <div className="relative">
            <input
              type="number"
              value={insuranceStr}
              onChange={handleInsuranceChange}
              disabled={autoInsurance}
              className={`w-full pl-4 pr-4 py-3 border border-slate-300 rounded-lg transition-all font-medium text-slate-800 ${autoInsurance ? 'bg-slate-50 text-slate-500' : 'focus:ring-2 focus:ring-blue-500'}`}
              placeholder="0"
            />
            <span className="absolute right-4 top-3 text-slate-400 text-sm">VND</span>
          </div>
        </div>
      </div>
    </div>
  );
};