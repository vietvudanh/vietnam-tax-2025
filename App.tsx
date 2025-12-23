import React, { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ComparisonChart } from './components/ComparisonChart';
import { BracketTable } from './components/BracketTable';
import { DeductionDetailTable } from './components/DeductionDetailTable';
import { calculateComparison, formatCurrency, REGIONAL_MIN_WAGE, EMPLOYER_RATES, OLD_CONFIG, NEW_CONFIG } from './utils/taxCalculator';
import { ComparisonResult } from './types';
import { TrendingDown, TrendingUp, Info, AlertCircle, Github, ExternalLink } from 'lucide-react';

// Constants
const BLOG_URL = 'https://vietvudanh.substack.com/p/minh-a-tao-trang-tinh-thue-tncn-2026';
const BLOG_LINK_TEXT = 'Mình đã tạo page này thế nào?';
const GA_EVENT_CATEGORY = 'blog_link';

// Type definition for Google Analytics
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      targetIdOrEventName: string,
      params?: Record<string, string | number | boolean>
    ) => void;
    dataLayer?: unknown[];
  }
}

const App: React.FC = () => {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<'I' | 'II' | 'III' | 'IV'>('I');
  const [useNewDeduction, setUseNewDeduction] = useState<boolean>(true);

  // Memoize the callback to ensure stable function reference across renders.
  // This prevents the useEffect in InputForm from triggering an infinite update loop.
  const handleCalculate = useCallback((gross: number, dependents: number, insurance: number, region: 'I' | 'II' | 'III' | 'IV') => {
    const personalDeduction = useNewDeduction ? NEW_CONFIG.personalDeduction : OLD_CONFIG.personalDeduction;
    const dependentDeduction = useNewDeduction ? NEW_CONFIG.dependentDeduction : OLD_CONFIG.dependentDeduction;

    const calcResult = calculateComparison(gross, dependents, region, insurance, personalDeduction, dependentDeduction);
    setResult(calcResult);
    setSelectedRegion(region);
  }, [useNewDeduction]);

  // Google Analytics tracking helper
  const trackEvent = (eventName: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, {
        event_category: GA_EVENT_CATEGORY,
        event_label: BLOG_LINK_TEXT
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
          <a
            href={BLOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('top_banner_blog_click')}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-2 rounded-lg"
          >
            <span>{BLOG_LINK_TEXT}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
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
                Thông tin giảm trừ {useNewDeduction ? 'mới (từ 1/1/2026)' : 'cũ (trước 1/1/2026)'}
              </h3>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-blue-800">Áp dụng mức giảm trừ mới (từ 1/1/2026)</span>
                <button
                  onClick={() => setUseNewDeduction(!useNewDeduction)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useNewDeduction ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useNewDeduction ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
              <ul className="space-y-3 text-sm text-blue-800">
                <li className="flex justify-between border-b border-blue-200 pb-2">
                  <span>Bản thân:</span>
                  <span className="font-bold">{useNewDeduction ? '15.5tr' : '11tr'}</span>
                </li>
                <li className="flex justify-between">
                  <span>Người phụ thuộc:</span>
                  <span className="font-bold">{useNewDeduction ? '6.2tr' : '4.4tr'}</span>
                </li>
              </ul>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl">
              <h3 className="font-semibold text-emerald-900 flex items-center gap-2 mb-3">
                <TrendingDown className="w-5 h-5 text-emerald-600" />
                Lợi ích từ thay đổi mới
              </h3>
              <ul className="space-y-2 text-sm text-emerald-800">
                <li className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Người thu nhập thấp/trung bình được giảm thuế đáng kể</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Người có người phụ thuộc được hỗ trợ nhiều hơn</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Mức miễn thuế tăng lên rõ rệt</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Thuế suất các bậc giảm (10% thay vì 10-15%, 20% thay vì 20-25%)</span>
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

                {/* Detail Breakdown */}
                {result && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">Diễn giải chi tiết (VNĐ)</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Áp dụng vùng {selectedRegion} - Mức lương tối thiểu {formatCurrency(REGIONAL_MIN_WAGE[selectedRegion])}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-slate-700">
                          <thead className="bg-slate-50 text-xs text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Diễn giải</th>
                              <th className="px-4 py-3 text-right">QUY ĐỊNH CŨ</th>
                              <th className="px-4 py-3 text-right">MỚI (SAU 1/7/2026)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Lương GROSS</th>
                              <td className="px-4 py-3 text-right">{formatCurrency(result.oldReg.grossIncome)}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(result.newReg.grossIncome)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Bảo hiểm xã hội (8%)</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.oldReg.insuranceBreakdown?.bhxh || 0)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.newReg.insuranceBreakdown?.bhxh || 0)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Bảo hiểm y tế (1.5%)</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.oldReg.insuranceBreakdown?.bhyt || 0)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.newReg.insuranceBreakdown?.bhyt || 0)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Bảo hiểm thất nghiệp (1%)</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.oldReg.insuranceBreakdown?.bhtn || 0)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.newReg.insuranceBreakdown?.bhtn || 0)}</td>
                            </tr>
                            <tr className="bg-slate-50">
                              <th className="px-4 py-3 font-semibold">Thu nhập trước thuế</th>
                              <td className="px-4 py-3 text-right">{formatCurrency(result.oldReg.incomeBeforeTax)}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(result.newReg.incomeBeforeTax)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Giảm trừ bản thân</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.oldReg.personalDeduction)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.newReg.personalDeduction)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Giảm trừ người phụ thuộc</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.oldReg.dependentDeduction)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.newReg.dependentDeduction)}</td>
                            </tr>
                            <tr className="bg-slate-50">
                              <th className="px-4 py-3 font-semibold">Thu nhập chịu thuế</th>
                              <td className="px-4 py-3 text-right">{formatCurrency(result.oldReg.taxableIncome)}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(result.newReg.taxableIncome)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Thuế thu nhập cá nhân</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.oldReg.taxAmount)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(result.newReg.taxAmount)}</td>
                            </tr>
                            <tr className="bg-emerald-50">
                              <th className="px-4 py-3 font-semibold">Lương NET</th>
                              <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(result.oldReg.netIncome)}</td>
                              <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(result.newReg.netIncome)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">(*) Chi tiết thuế thu nhập cá nhân (VNĐ)</h3>
                        <p className="text-sm text-slate-500 mt-1">So sánh chi tiết theo từng bậc lũy tiến</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-slate-700">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                              <th className="px-4 py-3 w-16 text-center">Bậc</th>
                              <th className="px-4 py-3 text-right bg-slate-100/50">QUY ĐỊNH CŨ</th>
                              <th className="px-4 py-3 text-right text-emerald-700 bg-emerald-50/30">MỚI (DỰ KIẾN)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {Array.from({ length: 7 }).map((_, idx) => {
                              const level = idx + 1;
                              const oldItem = result.oldReg.bracketsBreakdown.find(b => b.level === level);
                              const newItem = result.newReg.bracketsBreakdown.find(b => b.level === level);

                              if (!oldItem && !newItem) return null;

                              return (
                                <tr key={level} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 font-bold text-center text-slate-400">
                                    {level}
                                  </td>

                                  {/* OLD COLUMN */}
                                  <td className="px-4 py-3 text-right align-top bg-slate-50/30">
                                    {oldItem ? (
                                      <div>
                                        <div className="font-medium text-slate-900">{formatCurrency(oldItem.tax)}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                          {formatCurrency(oldItem.amountInBracket)} × {oldItem.rate}%
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>

                                  {/* NEW COLUMN */}
                                  <td className="px-4 py-3 text-right align-top bg-emerald-50/10">
                                    {newItem ? (
                                      <div>
                                        <div className="font-bold text-emerald-700">{formatCurrency(newItem.tax)}</div>
                                        <div className="text-xs text-emerald-600/70 mt-0.5">
                                          {formatCurrency(newItem.amountInBracket)} × {newItem.rate}%
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-300">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Summary Row */}
                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                              <td className="px-4 py-3 text-center">Tổng</td>
                              <td className="px-4 py-3 text-right text-red-600">
                                {formatCurrency(result.oldReg.taxAmount)}
                              </td>
                              <td className="px-4 py-3 text-right text-red-600 bg-emerald-50/30">
                                {formatCurrency(result.newReg.taxAmount)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employer contribution table */}
                {result && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800">Người sử dụng lao động trả (VNĐ)</h3>
                      <p className="text-sm text-slate-500 mt-1">Tính trên mức đóng bảo hiểm: {formatCurrency(result.newReg.insuranceBase || 0)}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-left text-slate-700">
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Lương GROSS</th>
                            <td className="px-4 py-3">{formatCurrency(result.newReg.grossIncome)}</td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 font-semibold">BHXH (17%)</th>
                            <td className="px-4 py-3">{formatCurrency((result.newReg.insuranceBase || 0) * EMPLOYER_RATES.bhxh)}</td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 font-semibold">BHYT (3%)</th>
                            <td className="px-4 py-3">{formatCurrency((result.newReg.insuranceBase || 0) * EMPLOYER_RATES.bhyt)}</td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 font-semibold">BHTN (1%)</th>
                            <td className="px-4 py-3">{formatCurrency((result.newReg.insuranceBase || 0) * EMPLOYER_RATES.bhtn)}</td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 font-semibold">BHTNLĐ-BNN (0.5%)</th>
                            <td className="px-4 py-3">{formatCurrency((result.newReg.insuranceBase || 0) * EMPLOYER_RATES.bhtnld_bnn)}</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <th className="px-4 py-3 font-semibold">Tổng cộng</th>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {formatCurrency(
                                result.newReg.grossIncome +
                                (result.newReg.insuranceBase || 0) *
                                (EMPLOYER_RATES.bhxh +
                                  EMPLOYER_RATES.bhyt +
                                  EMPLOYER_RATES.bhtn +
                                  EMPLOYER_RATES.bhtnld_bnn)
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

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

      <footer className="bg-white border-t border-slate-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div>Made by <a className="text-slate-700 font-medium hover:underline" href="https://github.com/vietvudanh" target="_blank" rel="noopener noreferrer">vietvudanh</a></div>
            <div className="flex items-center gap-4">
              <a
                href={BLOG_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('footer_blog_click')}
                className="flex items-center gap-1 text-slate-600 hover:text-blue-600 hover:underline transition-colors"
              >
                <span>{BLOG_LINK_TEXT}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <a className="flex items-center gap-2 text-slate-600 hover:text-slate-800" href="https://github.com/vietvudanh/vietnam-tax-2025" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5" />
                <span>vietvudanh/vietnam-tax-2025</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
