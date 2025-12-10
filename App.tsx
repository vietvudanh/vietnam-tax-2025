import React, { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ComparisonChart } from './components/ComparisonChart';
import { BracketTable } from './components/BracketTable';
import { DeductionDetailTable } from './components/DeductionDetailTable';
import { calculateComparison, formatCurrency } from './utils/taxCalculator';
import { ComparisonResult } from './types';
import { TrendingDown, TrendingUp, Info, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [result, setResult] = useState<ComparisonResult | null>(null);

  // Memoize the callback to ensure stable function reference across renders.
  // This prevents the useEffect in InputForm from triggering an infinite update loop.
  const handleCalculate = useCallback((gross: number, dependents: number, insurance: number) => {
    const calcResult = calculateComparison(gross, dependents, insurance);
    setResult(calcResult);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Tính Thuế TNCN 2026</h1>
              <p className="text-xs text-slate-500">So sánh luật cũ & mới (Hiệu lực 1/7/2026)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-4 space-y-6">
            <InputForm onCalculate={handleCalculate} />
            
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-blue-600" />
                Thông tin giảm trừ mới (từ 1/1/2026)
              </h3>
              <ul className="space-y-3 text-sm text-blue-800">
                <li className="flex justify-between border-b border-blue-200 pb-2">
                  <span>Bản thân:</span>
                  <span className="font-bold">11tr → 15.5tr</span>
                </li>
                <li className="flex justify-between">
                  <span>Người phụ thuộc:</span>
                  <span className="font-bold">4.4tr → 6.2tr</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-8">
            {result && (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OLD CARD */}
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-bl-lg">
                      QUY ĐỊNH CŨ
                    </div>
                    <div className="text-sm text-slate-500 mb-1">Thực lĩnh (Net)</div>
                    <div className="text-3xl font-bold text-slate-700 mb-4">
                      {formatCurrency(result.oldReg.netIncome)}
                    </div>
                    <div className="space-y-2 text-sm border-t border-slate-200 pt-3">
                      <div className="flex justify-between text-slate-600">
                        <span>Thuế phải đóng:</span>
                        <span className="font-medium text-red-500">{formatCurrency(result.oldReg.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Tổng giảm trừ:</span>
                        <span className="font-medium">
                          {formatCurrency(result.oldReg.personalDeduction + result.oldReg.dependentDeduction)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* NEW CARD */}
                  <div className="bg-white border-2 border-green-500 shadow-sm rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-bl-lg">
                      MỚI (SAU 1/7/2026)
                    </div>
                    <div className="text-sm text-slate-500 mb-1">Thực lĩnh (Net)</div>
                    <div className="text-3xl font-bold text-emerald-600 mb-4">
                      {formatCurrency(result.newReg.netIncome)}
                    </div>
                    <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
                      <div className="flex justify-between text-slate-600">
                        <span>Thuế phải đóng:</span>
                        <span className="font-medium text-red-500">{formatCurrency(result.newReg.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Tổng giảm trừ:</span>
                        <span className="font-medium">
                          {formatCurrency(result.newReg.personalDeduction + result.newReg.dependentDeduction)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Savings Badge */}
                    <div className="mt-4 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between border border-emerald-100">
                      <span>Bạn tiết kiệm được:</span>
                      <span className="text-lg flex items-center gap-1">
                        {formatCurrency(result.diffNet)}
                        <TrendingDown className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                   <h3 className="text-lg font-bold text-slate-800 mb-4">Biểu đồ so sánh</h3>
                   <ComparisonChart data={result} />
                </div>

                {/* Detailed Table Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                       <AlertCircle className="w-5 h-5 text-orange-500" />
                       Chi tiết thay đổi biểu thuế lũy tiến
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      So sánh các bậc thuế giữa quy định cũ và dự thảo quy định mới
                    </p>
                  </div>
                  <BracketTable />
                </div>

                {/* Deduction Detail Table */}
                <DeductionDetailTable />
              </>
            )}
            
            {!result && (
              <div className="h-full flex items-center justify-center text-slate-400">
                Nhập thông tin lương để xem kết quả...
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;