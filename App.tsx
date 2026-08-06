import React, { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ComparisonChart } from './components/ComparisonChart';
import { BracketTable } from './components/BracketTable';
import { DeductionDetailTable } from './components/DeductionDetailTable';
import { TaxReductionChart } from './components/TaxReductionChart';
import { LawChangelog } from './components/LawChangelog';
import { AnnualSummary } from './components/AnnualSummary';
import { MonthlyBreakdownTable } from './components/MonthlyBreakdownTable';
import { NetGrossConverter } from './components/NetGrossConverter';
import {
  calculateComparison,
  calculateAnnualComparison,
  formatCurrency,
  REGIONAL_MIN_WAGE_CURRENT,
  REGIONAL_MIN_WAGE_2026,
  REGIONAL_MIN_WAGE_2027_DRAFT,
  EMPLOYER_RATES,
  OLD_CONFIG,
  NEW_CONFIG
} from './utils/taxCalculator';
import {
  ComparisonResult,
  ExtraIncomeInput,
  EMPTY_EXTRA_INCOME,
  MEAL_ALLOWANCE_CAP_NEW,
  MEDICAL_DEDUCTION_CAP_YEAR,
  EDUCATION_DEDUCTION_CAP_YEAR,
  DEPENDENT_INCOME_THRESHOLD,
  CASUAL_INCOME_WITHHOLDING_THRESHOLD,
  CASUAL_INCOME_NO_FINALIZATION_THRESHOLD,
  MinWageSet,
  TaxPeriod,
  BonusEntry,
  AnnualComparisonResult,
} from './types';
import { TrendingDown, TrendingUp, Info, AlertCircle, Github, ExternalLink, Calculator, History, CalendarRange, ArrowLeftRight } from 'lucide-react';

type Tab = 'calculator' | 'annual' | 'conversion' | 'changelog';

/** Hai tab đầu dùng chung một khối nhập liệu, chỉ khác kỳ tính thuế của phần kết quả. */
const CALCULATOR_TABS: Tab[] = ['calculator', 'annual'];

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

// Defined at module scope so the map identities stay stable across renders —
// handleCalculate depends on them and an unstable reference would loop forever.
const MIN_WAGE_OPTIONS: Record<
  MinWageSet,
  { map: Record<'I' | 'II' | 'III' | 'IV', number>; label: string; note: string }
> = {
  legacy: {
    map: REGIONAL_MIN_WAGE_CURRENT,
    label: 'Trước 2026',
    note: 'Áp dụng mức lương tối thiểu vùng trước 01/01/2026 khi tính trần BHTN',
  },
  current2026: {
    map: REGIONAL_MIN_WAGE_2026,
    label: 'Hiện hành',
    note: 'Áp dụng mức lương tối thiểu vùng hiện hành (từ 01/01/2026 - Nghị định 293/2025/NĐ-CP) khi tính trần BHTN',
  },
  draft2027: {
    map: REGIONAL_MIN_WAGE_2027_DRAFT,
    label: 'Dự kiến 2027',
    note: 'Mức DỰ KIẾN từ 01/01/2027 theo Dự thảo Nghị định thay thế NĐ 293/2025/NĐ-CP (Bộ Nội vụ công bố 20/7/2026) - chưa ban hành chính thức',
  },
};

// Chọn bộ lương tối thiểu vùng theo ngày hiện tại: mỗi mốc tự có hiệu lực khi đến hạn.
// Mức 2027 mới là dự thảo nên chỉ được chọn mặc định khi đã sang 01/01/2027.
const getDefaultMinWageSet = (today: Date = new Date()): MinWageSet => {
  if (today >= new Date(2027, 0, 1)) return 'draft2027';
  if (today >= new Date(2026, 0, 1)) return 'current2026';
  return 'legacy';
};

const App: React.FC = () => {
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [annualResult, setAnnualResult] = useState<AnnualComparisonResult | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<'I' | 'II' | 'III' | 'IV'>('I');
  const [useNewDeduction, setUseNewDeduction] = useState<boolean>(true);
  // Mặc định là bộ lương tối thiểu vùng đang có hiệu lực tại thời điểm truy cập.
  const [minWageSet, setMinWageSet] = useState<MinWageSet>(() => getDefaultMinWageSet());
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  // Kỳ tính thuế suy ra từ tab đang mở, không giữ state riêng - hai nguồn sự thật cho
  // cùng một thứ chắc chắn sẽ có lúc lệch nhau.
  const period: TaxPeriod = activeTab === 'annual' ? 'year' : 'month';
  const isCalculatorTab = CALCULATOR_TABS.includes(activeTab);
  const [monthsWorked, setMonthsWorked] = useState<number>(12);
  const [bonuses, setBonuses] = useState<BonusEntry[]>([]);

  const activeRegionalMinWage = MIN_WAGE_OPTIONS[minWageSet].map;
  const minWageNote = MIN_WAGE_OPTIONS[minWageSet].note;

  // Memoize the callback to ensure stable function reference across renders.
  // This prevents the useEffect in InputForm from triggering an infinite update loop.
  const handleCalculate = useCallback((
    gross: number,
    dependents: number,
    insurance: number | null,
    region: 'I' | 'II' | 'III' | 'IV',
    extra: ExtraIncomeInput = EMPTY_EXTRA_INCOME
  ) => {
    const personalDeduction = useNewDeduction ? NEW_CONFIG.personalDeduction : OLD_CONFIG.personalDeduction;
    const dependentDeduction = useNewDeduction ? NEW_CONFIG.dependentDeduction : OLD_CONFIG.dependentDeduction;

    const calcResult = calculateComparison(
      gross,
      dependents,
      region,
      insurance,
      personalDeduction,
      dependentDeduction,
      activeRegionalMinWage[region],
      extra
    );
    setResult(calcResult);

    // Quyết toán năm tính luôn cùng lúc để chuyển kỳ là hiển thị ngay, không phải chờ
    // người dùng gõ lại. Chi phí không đáng kể: 24 phép tính tháng cho hai bộ quy định.
    setAnnualResult(
      calculateAnnualComparison(
        {
          monthlyGross: gross,
          monthsWorked,
          bonuses,
          dependents,
          region,
          customInsuranceSalary: insurance,
          extra,
        },
        personalDeduction,
        dependentDeduction,
        activeRegionalMinWage[region]
      )
    );
    setSelectedRegion(region);
  }, [activeRegionalMinWage, useNewDeduction, monthsWorked, bonuses]);

  // Kỳ năm dùng lại đúng các bảng của kỳ tháng: `AnnualTaxResult.annual` vốn là một
  // `TaxResult`, chỉ khác mọi con số đã là số cả năm.
  const displayResult: ComparisonResult | null =
    period === 'year'
      ? annualResult && {
          oldReg: annualResult.oldReg.annual,
          newReg: annualResult.newReg.annual,
          diffTax: annualResult.diffTax,
          diffNet: annualResult.diffNet,
        }
      : result;

  const periodSuffix = period === 'year' ? ' / năm' : ' / tháng';

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

      {/* Tabs */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1">
          {([
            { id: 'calculator' as const, label: 'Tính thuế theo tháng', icon: Calculator },
            { id: 'annual' as const, label: 'Quyết toán thuế năm', icon: CalendarRange },
            { id: 'conversion' as const, label: 'Quy đổi Net/Gross', icon: ArrowLeftRight },
            { id: 'changelog' as const, label: 'Lịch sử thay đổi luật', icon: History },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === 'changelog' && <LawChangelog />}
        {activeTab === 'conversion' && (
          <NetGrossConverter
            regionalMinWageMap={activeRegionalMinWage}
            minWageNote={minWageNote}
            minWageSet={minWageSet}
            minWageSetLabels={{
              legacy: MIN_WAGE_OPTIONS.legacy.label,
              current2026: MIN_WAGE_OPTIONS.current2026.label,
              draft2027: MIN_WAGE_OPTIONS.draft2027.label,
            }}
            onChangeMinWageSet={setMinWageSet}
            useNewDeduction={useNewDeduction}
            onToggleDeduction={() => setUseNewDeduction(!useNewDeduction)}
          />
        )}

        {/*
          Tab "Tính thuế theo tháng" và "Quyết toán thuế năm" dùng CHUNG khối này. InputForm
          giữ nguyên vị trí trong cây React nên không bị unmount khi đổi tab - toàn bộ dữ
          liệu người dùng đã nhập được giữ lại. Chỉ cột kết quả bên phải đổi theo `period`.
        */}
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${isCalculatorTab ? '' : 'hidden'}`}>

          {/* Left Column: Input */}
          <div className="lg:col-span-4 space-y-6">
            {period === 'year' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <CalendarRange className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  Đang ở chế độ <strong>quyết toán cả năm</strong>. Nhập thêm số tháng làm việc và
                  các khoản thưởng một lần để biết bạn được hoàn thuế hay phải nộp thêm.
                </p>
              </div>
            )}

            <InputForm
              onCalculate={handleCalculate}
              regionalMinWageMap={activeRegionalMinWage}
              minWageNote={minWageNote}
              minWageSet={minWageSet}
              minWageSetLabels={{
                legacy: MIN_WAGE_OPTIONS.legacy.label,
                current2026: MIN_WAGE_OPTIONS.current2026.label,
                draft2027: MIN_WAGE_OPTIONS.draft2027.label,
              }}
              onChangeMinWageSet={setMinWageSet}
              period={period}
              monthsWorked={monthsWorked}
              bonuses={bonuses}
              onChangeMonthsWorked={setMonthsWorked}
              onChangeBonuses={setBonuses}
            />

            <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl shadow-sm">
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
                <li className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Miễn thuế tiền làm thêm giờ, làm ban đêm</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Thêm giảm trừ chi phí y tế và giáo dục (tối đa 47tr/năm)</span>
                </li>
              </ul>
            </div>

            {/* Điểm mới theo Nghị định 253/2026/NĐ-CP */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Điểm mới từ 1/7/2026
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Nghị định 253/2026/NĐ-CP & Thông tư 87/2026/TT-BTC
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span>Miễn thuế tiền ăn giữa ca</span>
                  <span className="font-semibold whitespace-nowrap">đến {formatCurrency(MEAL_ALLOWANCE_CAP_NEW)}/tháng</span>
                </li>
                <li className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span>Miễn thuế lương làm thêm giờ, ban đêm</span>
                  <span className="font-semibold whitespace-nowrap">Toàn bộ</span>
                </li>
                <li className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span>Giảm trừ chi phí y tế</span>
                  <span className="font-semibold whitespace-nowrap">đến {formatCurrency(MEDICAL_DEDUCTION_CAP_YEAR)}/năm</span>
                </li>
                <li className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span>Giảm trừ chi phí giáo dục - đào tạo</span>
                  <span className="font-semibold whitespace-nowrap">đến {formatCurrency(EDUCATION_DEDUCTION_CAP_YEAR)}/năm</span>
                </li>
                <li className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span>Ngưỡng thu nhập của người phụ thuộc</span>
                  <span className="font-semibold whitespace-nowrap">{formatCurrency(DEPENDENT_INCOME_THRESHOLD)}/tháng</span>
                </li>
                <li className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span>Khấu trừ 10% thu nhập vãng lai</span>
                  <span className="font-semibold whitespace-nowrap">từ {formatCurrency(CASUAL_INCOME_WITHHOLDING_THRESHOLD)}/lần</span>
                </li>
                <li className="flex justify-between gap-3">
                  <span>Không phải quyết toán thu nhập vãng lai</span>
                  <span className="font-semibold whitespace-nowrap">dưới {formatCurrency(CASUAL_INCOME_NO_FINALIZATION_THRESHOLD)}/tháng</span>
                </li>
              </ul>
              <p className="text-xs text-slate-500 mt-4 bg-slate-50 border border-slate-100 rounded-lg p-3">
                Với 1 người phụ thuộc và giảm trừ y tế, giáo dục tối đa, thu nhập trên khoảng
                <strong> 28,6 triệu đồng/tháng</strong> mới bắt đầu phát sinh thuế TNCN.
              </p>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8 space-y-8">
            {displayResult && (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OLD CARD */}
                  <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-bl-lg">
                      QUY ĐỊNH CŨ
                    </div>
                    <div className="text-sm text-slate-500 mb-1">Thực lĩnh (Net){periodSuffix}</div>
                    <div className="text-3xl font-bold text-slate-700 mb-4">
                      {formatCurrency(displayResult.oldReg.netIncome)}
                    </div>
                    <div className="space-y-2 text-sm border-t border-slate-200 pt-3">
                      <div className="flex justify-between text-slate-600">
                        <span>Thuế phải đóng:</span>
                        <span className="font-medium text-red-500">{formatCurrency(displayResult.oldReg.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Tổng giảm trừ:</span>
                        <span className="font-medium">
                          {formatCurrency(displayResult.oldReg.personalDeduction + displayResult.oldReg.dependentDeduction)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* NEW CARD */}
                  <div className="bg-white border-2 border-green-500 shadow-sm rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-bl-lg">
                      MỚI (SAU 1/7/2026)
                    </div>
                    <div className="text-sm text-slate-500 mb-1">Thực lĩnh (Net){periodSuffix}</div>
                    <div className="text-3xl font-bold text-emerald-600 mb-4">
                      {formatCurrency(displayResult.newReg.netIncome)}
                    </div>
                    <div className="space-y-2 text-sm border-t border-slate-100 pt-3">
                      <div className="flex justify-between text-slate-600">
                        <span>Thuế phải đóng:</span>
                        <span className="font-medium text-red-500">{formatCurrency(displayResult.newReg.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Tổng giảm trừ:</span>
                        <span className="font-medium">
                          {formatCurrency(displayResult.newReg.personalDeduction + displayResult.newReg.dependentDeduction)}
                        </span>
                      </div>
                    </div>

                    {/* Savings Badge */}
                    <div className="mt-4 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between border border-emerald-100">
                      <span>Bạn tiết kiệm được:</span>
                      <span className="text-lg flex items-center gap-1">
                        {formatCurrency(displayResult.diffNet)}
                        <TrendingDown className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Biểu đồ so sánh</h3>
                  <ComparisonChart data={displayResult} period={period} />
                </div>

                {/* Quyết toán năm: thẻ hoàn/nộp thêm và bảng chi tiết 12 tháng */}
                {period === 'year' && annualResult && (
                  <>
                    <AnnualSummary data={annualResult} />
                    <MonthlyBreakdownTable
                      data={useNewDeduction ? annualResult.newReg : annualResult.oldReg}
                      label={useNewDeduction ? 'Quy định mới' : 'Quy định cũ'}
                    />
                  </>
                )}

                {/* Detail Breakdown */}
                {displayResult && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">Diễn giải chi tiết (VNĐ)</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Áp dụng vùng {selectedRegion} - Mức lương tối thiểu {formatCurrency(activeRegionalMinWage[selectedRegion])}
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
                              <td className="px-4 py-3 text-right">{formatCurrency(displayResult.oldReg.grossIncome)}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(displayResult.newReg.grossIncome)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Bảo hiểm xã hội (8%)</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.oldReg.insuranceBreakdown?.bhxh || 0)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.newReg.insuranceBreakdown?.bhxh || 0)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Bảo hiểm y tế (1.5%)</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.oldReg.insuranceBreakdown?.bhyt || 0)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.newReg.insuranceBreakdown?.bhyt || 0)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Bảo hiểm thất nghiệp (1%)</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.oldReg.insuranceBreakdown?.bhtn || 0)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.newReg.insuranceBreakdown?.bhtn || 0)}</td>
                            </tr>
                            <tr className="bg-slate-50">
                              <th className="px-4 py-3 font-semibold">Thu nhập trước thuế</th>
                              <td className="px-4 py-3 text-right">{formatCurrency(displayResult.oldReg.incomeBeforeTax)}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(displayResult.newReg.incomeBeforeTax)}</td>
                            </tr>
                            {(displayResult.oldReg.exemptIncome > 0 || displayResult.newReg.exemptIncome > 0) && (
                              <tr>
                                <th className="px-4 py-3 font-semibold">
                                  Thu nhập miễn thuế
                                  <span className="block text-xs font-normal text-slate-400">Ăn giữa ca (trong hạn mức) + làm thêm giờ, ban đêm</span>
                                </th>
                                <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.oldReg.exemptIncome)}</td>
                                <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.newReg.exemptIncome)}</td>
                              </tr>
                            )}
                            <tr>
                              <th className="px-4 py-3 font-semibold">Giảm trừ bản thân</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.oldReg.personalDeduction)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.newReg.personalDeduction)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Giảm trừ người phụ thuộc</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.oldReg.dependentDeduction)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.newReg.dependentDeduction)}</td>
                            </tr>
                            {(displayResult.oldReg.specialDeduction > 0 || displayResult.newReg.specialDeduction > 0) && (
                              <tr>
                                <th className="px-4 py-3 font-semibold">
                                  Giảm trừ y tế, giáo dục
                                  <span className="block text-xs font-normal text-slate-400">Quy về tháng, tối đa 47tr/năm</span>
                                </th>
                                <td className="px-4 py-3 text-right text-slate-400">
                                  {displayResult.oldReg.specialDeduction > 0 ? `- ${formatCurrency(displayResult.oldReg.specialDeduction)}` : 'Không áp dụng'}
                                </td>
                                <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.newReg.specialDeduction)}</td>
                              </tr>
                            )}
                            <tr className="bg-slate-50">
                              <th className="px-4 py-3 font-semibold">Thu nhập chịu thuế</th>
                              <td className="px-4 py-3 text-right">{formatCurrency(displayResult.oldReg.taxableIncome)}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(displayResult.newReg.taxableIncome)}</td>
                            </tr>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Thuế thu nhập cá nhân</th>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.oldReg.taxAmount)}</td>
                              <td className="px-4 py-3 text-right text-red-500">- {formatCurrency(displayResult.newReg.taxAmount)}</td>
                            </tr>
                            <tr className="bg-emerald-50">
                              <th className="px-4 py-3 font-semibold">Lương NET</th>
                              <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(displayResult.oldReg.netIncome)}</td>
                              <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(displayResult.newReg.netIncome)}</td>
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
                              <th className="px-4 py-3 text-right text-emerald-700 bg-emerald-50/30">MỚI (SAU 1/7/2026)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {Array.from({ length: 7 }).map((_, idx) => {
                              const level = idx + 1;
                              const oldItem = displayResult.oldReg.bracketsBreakdown.find(b => b.level === level);
                              const newItem = displayResult.newReg.bracketsBreakdown.find(b => b.level === level);

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
                                {formatCurrency(displayResult.oldReg.taxAmount)}
                              </td>
                              <td className="px-4 py-3 text-right text-red-600 bg-emerald-50/30">
                                {formatCurrency(displayResult.newReg.taxAmount)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employer contribution table */}
                {displayResult && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                      <h3 className="text-lg font-bold text-slate-800">Người sử dụng lao động trả (VNĐ{periodSuffix})</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Tính trên mức đóng bảo hiểm{periodSuffix}: {formatCurrency(displayResult.newReg.insuranceBase || 0)}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-left text-slate-700">
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Lương GROSS</th>
                            <td className="px-4 py-3">{formatCurrency(displayResult.newReg.grossIncome)}</td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 font-semibold">BHXH (17%)</th>
                            <td className="px-4 py-3">{formatCurrency((displayResult.newReg.insuranceBase || 0) * EMPLOYER_RATES.bhxh)}</td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 font-semibold">BHYT (3%)</th>
                            <td className="px-4 py-3">{formatCurrency((displayResult.newReg.insuranceBase || 0) * EMPLOYER_RATES.bhyt)}</td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 font-semibold">BHTN (1%)</th>
                            <td className="px-4 py-3">{formatCurrency((displayResult.newReg.insuranceBase || 0) * EMPLOYER_RATES.bhtn)}</td>
                          </tr>
                          <tr>
                            <th className="px-4 py-3 font-semibold">BHTNLĐ-BNN (0.5%)</th>
                            <td className="px-4 py-3">{formatCurrency((displayResult.newReg.insuranceBase || 0) * EMPLOYER_RATES.bhtnld_bnn)}</td>
                          </tr>
                          <tr className="bg-slate-50">
                            <th className="px-4 py-3 font-semibold">Tổng cộng</th>
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {formatCurrency(
                                displayResult.newReg.grossIncome +
                                (displayResult.newReg.insuranceBase || 0) *
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
                      So sánh các bậc thuế giữa quy định cũ và Luật Thuế TNCN 2025 (hiệu lực 1/7/2026)
                    </p>
                  </div>
                  <BracketTable />
                </div>

                {/* Deduction Detail Table */}
                <DeductionDetailTable />
              </>
            )}

            {!displayResult && (
              <div className="h-full flex items-center justify-center text-slate-400">
                Nhập thông tin lương để xem kết quả...
              </div>
            )}
          </div>
        </div>

        {/* Tax Reduction Chart Section - kept mounted so switching tabs preserves inputs */}
        <div className={`mt-8 ${isCalculatorTab ? '' : 'hidden'}`}>
          <TaxReductionChart />
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
