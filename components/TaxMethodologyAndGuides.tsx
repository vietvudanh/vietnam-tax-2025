import React, { useMemo } from 'react';
import {
  Scale,
  BookOpen,
  Calculator,
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Globe,
  FileText,
  ArrowRight,
  Info,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  calculateComparison,
  formatCurrency,
  OLD_CONFIG,
  NEW_CONFIG,
  INSURANCE_RATES,
  BHXH_MAX_CAP,
  LUONG_CO_BAN,
  REGIONAL_MIN_WAGE_2026,
} from '../utils/taxCalculator';
import {
  MEAL_ALLOWANCE_CAP_OLD,
  MEAL_ALLOWANCE_CAP_NEW,
  MEDICAL_DEDUCTION_CAP_YEAR,
  EDUCATION_DEDUCTION_CAP_YEAR,
  DEPENDENT_INCOME_THRESHOLD,
  CASUAL_INCOME_WITHHOLDING_THRESHOLD,
  CASUAL_INCOME_NO_FINALIZATION_THRESHOLD,
  TaxPeriod,
} from '../types';

export interface TaxMethodologyAndGuidesProps {
  onNavigateToTab?: (tab: 'calculator' | 'annual' | 'profiles' | 'conversion' | 'latePayment' | 'changelog') => void;
  onQuickLoadSalary?: (gross: number, dependents: number, targetPeriod?: TaxPeriod) => void;
}

interface LegalSourceItem {
  code: string;
  title: string;
  issuedBy: string;
  effectiveDate: string;
  scope: string;
  govUrl: string;
  tvplUrl: string;
}

const OFFICIAL_LEGAL_SOURCES: LegalSourceItem[] = [
  {
    code: 'Luật số 109/2025/QH15',
    title: 'Luật Thuế thu nhập cá nhân 2025',
    issuedBy: 'Quốc hội khóa XV (thông qua ngày 10/12/2025)',
    effectiveDate: '01/07/2026 (thu nhập tiền lương, tiền công áp dụng từ kỳ tính thuế năm 2026)',
    scope: 'Rút gọn biểu thuế lũy tiến từng phần từ 7 bậc xuống 5 bậc (5%, 10%, 20%, 30%, 35%); nâng ngưỡng chịu thuế suất 35% từ 80 triệu lên 100 triệu đồng/tháng; quy định khung giảm trừ gia cảnh, y tế, giáo dục.',
    govUrl: 'https://vanban.chinhphu.vn/?classid=1&docid=216495&pageid=27160&typegroupid=1',
    tvplUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Luat-Thue-thu-nhap-ca-nhan-2025-so-109-2025-QH15-665870.aspx',
  },
  {
    code: 'Nghị quyết 110/2025/UBTVQH15',
    title: 'Nghị quyết về điều chỉnh mức giảm trừ gia cảnh của thuế TNCN',
    issuedBy: 'Ủy ban Thường vụ Quốc hội',
    effectiveDate: 'Kỳ tính thuế năm 2026 (từ 01/01/2026)',
    scope: 'Nâng mức giảm trừ cho bản thân người nộp thuế từ 11 triệu lên 15,5 triệu đồng/tháng (186 triệu/năm) và giảm trừ cho mỗi người phụ thuộc từ 4,4 triệu lên 6,2 triệu đồng/tháng (74,4 triệu/năm).',
    govUrl: 'https://vanban.chinhphu.vn/',
    tvplUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-quyet-110-2025-UBTVQH15-muc-giam-tru-gia-canh-thue-thu-nhap-ca-nhan-665865.aspx',
  },
  {
    code: 'Nghị định 253/2026/NĐ-CP',
    title: 'Quy định chi tiết và hướng dẫn thi hành Luật Thuế TNCN',
    issuedBy: 'Chính phủ (ban hành ngày 30/06/2026)',
    effectiveDate: '01/07/2026',
    scope: 'Miễn thuế 100% tiền lương làm thêm giờ, làm việc ban đêm (Điều 26); nâng trần miễn thuế tiền ăn giữa ca lên 1,2 triệu đồng/tháng (điểm g khoản 2 Điều 8); giảm trừ chi phí y tế tối đa 23 triệu/năm và giáo dục tối đa 24 triệu/năm (Điều 49); nâng ngưỡng khấu trừ 10% vãng lai lên 5 triệu/lần (Điều 50).',
    govUrl: 'https://vanban.chinhphu.vn/?classid=1&docid=218684&pageid=27160',
    tvplUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Nghi-dinh-253-2026-ND-CP-huong-dan-Luat-Thue-thu-nhap-ca-nhan-699193.aspx',
  },
  {
    code: 'Thông tư 87/2026/TT-BTC',
    title: 'Hướng dẫn thi hành Luật Thuế TNCN và Nghị định 253/2026/NĐ-CP',
    issuedBy: 'Bộ Tài chính (ban hành ngày 30/06/2026)',
    effectiveDate: '01/07/2026',
    scope: 'Nâng ngưỡng thu nhập bình quân tháng tối đa để xác định người phụ thuộc từ 1 triệu đồng lên 3 triệu đồng/tháng; hướng dẫn hồ sơ chứng từ giảm trừ chi phí khám chữa bệnh và học phí.',
    govUrl: 'https://vanban.chinhphu.vn/?docid=218772&pageid=27160',
    tvplUrl: 'https://thuvienphapluat.vn/van-ban/Thue-Phi-Le-Phi/Thong-tu-87-2026-TT-BTC-huong-dan-Luat-Thue-thu-nhap-ca-nhan-Nghi-dinh-253-2026-ND-CP-713265.aspx',
  },
  {
    code: 'Nghị định 293/2025/NĐ-CP',
    title: 'Quy định mức lương tối thiểu đối với người lao động làm việc theo HĐLĐ',
    issuedBy: 'Chính phủ',
    effectiveDate: '01/01/2026',
    scope: 'Quy định mức lương tối thiểu 4 vùng từ năm 2026 (Vùng I: 5.310.000 ₫, Vùng II: 4.730.000 ₫, Vùng III: 4.140.000 ₫, Vùng IV: 3.700.000 ₫), làm căn cứ tính trần đóng Bảo hiểm thất nghiệp (BHTN = 20 × lương tối thiểu vùng).',
    govUrl: 'https://vanban.chinhphu.vn/',
    tvplUrl: 'https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Nghi-dinh-293-2025-ND-CP-quy-dinh-muc-luong-toi-thieu-lao-dong-lam-viec-theo-hop-dong-lao-dong-665866.aspx',
  },
];

interface BenchmarkSpec {
  gross: number;
  dependents: number;
  label: string;
  highlight?: boolean;
}

const BENCHMARK_SPECS: BenchmarkSpec[] = [
  { gross: 17_000_000, dependents: 0, label: '17 triệu (0 NPT)' },
  { gross: 20_000_000, dependents: 0, label: '20 triệu (0 NPT)' },
  { gross: 25_000_000, dependents: 1, label: '25 triệu (1 NPT)' },
  { gross: 30_000_000, dependents: 1, label: '30 triệu (1 NPT)' },
  { gross: 50_000_000, dependents: 1, label: '50 triệu (1 NPT)', highlight: true },
  { gross: 80_000_000, dependents: 2, label: '80 triệu (2 NPT)' },
  { gross: 100_000_000, dependents: 2, label: '100 triệu (2 NPT)' },
];

export const TaxMethodologyAndGuides: React.FC<TaxMethodologyAndGuidesProps> = ({
  onNavigateToTab,
  onQuickLoadSalary,
}) => {
  const workedExample50M = useMemo(() => {
    const minWage = REGIONAL_MIN_WAGE_2026.I;
    const oldSide = calculateComparison(
      50_000_000,
      1,
      'I',
      null,
      OLD_CONFIG.personalDeduction,
      OLD_CONFIG.dependentDeduction,
      minWage
    ).oldReg;
    const newSide = calculateComparison(
      50_000_000,
      1,
      'I',
      null,
      NEW_CONFIG.personalDeduction,
      NEW_CONFIG.dependentDeduction,
      minWage
    ).newReg;
    const savingsMonth = oldSide.taxAmount - newSide.taxAmount;
    const savingsYear = savingsMonth * 12;
    const savingsPct = ((savingsMonth / oldSide.taxAmount) * 100).toFixed(1);
    return { oldSide, newSide, savingsMonth, savingsYear, savingsPct };
  }, []);

  const benchmarkRows = useMemo(() => {
    const minWage = REGIONAL_MIN_WAGE_2026.I;
    return BENCHMARK_SPECS.map((spec) => {
      const oldSide = calculateComparison(
        spec.gross,
        spec.dependents,
        'I',
        null,
        OLD_CONFIG.personalDeduction,
        OLD_CONFIG.dependentDeduction,
        minWage
      ).oldReg;
      const newSide = calculateComparison(
        spec.gross,
        spec.dependents,
        'I',
        null,
        NEW_CONFIG.personalDeduction,
        NEW_CONFIG.dependentDeduction,
        minWage
      ).newReg;
      const savingsYear = (oldSide.taxAmount - newSide.taxAmount) * 12;
      return {
        ...spec,
        oldTax: oldSide.taxAmount,
        newTax: newSide.taxAmount,
        savingsYear,
        newNet: newSide.netIncome,
      };
    });
  }, []);
  return (
    <section
      aria-label="Phương pháp tính thuế, Căn cứ pháp lý và Ví dụ minh họa"
      className="mt-12 space-y-8 border-t border-slate-200 pt-10"
    >
      {/* 1. Trust & Verification Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Đã đối chiếu văn bản pháp luật chính thức (Luật 109/2025/QH15 &amp; NĐ 253/2026/NĐ-CP)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Phương Pháp Tính Thuế TNCN 2026, Căn Cứ Pháp Lý &amp; Hướng Dẫn Chi Tiết
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Tài liệu minh bạch hóa toàn bộ công thức tính thuế thu nhập cá nhân (Vietnam Personal Income Tax Calculator 2026),
              quy đổi lương Gross sang Net, ví dụ tính toán từng dòng cho mức lương 50 triệu VNĐ/tháng, quy định cho người
              nước ngoài (Expat) và danh mục văn bản gốc trên Cổng thông tin điện tử Chính phủ.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-4 text-xs space-y-2 shrink-0">
            <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Thông tin kiểm duyệt dữ liệu</span>
            </div>
            <div className="text-slate-200">
              <span className="text-slate-400">Rà soát lần cuối:</span>{' '}
              <time dateTime="2026-10-30" className="font-semibold text-white">
                30/10/2026
              </time>
            </div>
            <div className="text-slate-200">
              <span className="text-slate-400">Hiệu lực luật mới:</span>{' '}
              <span className="font-semibold text-white">01/07/2026 (Kỳ thuế 2026)</span>
            </div>
            <div className="text-slate-200">
              <span className="text-slate-400">Phiên bản công cụ:</span>{' '}
              <span className="font-semibold text-white">v2026.10 (Open Source)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Worked Example (50M VND Gross) + Benchmark Savings Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Worked Example */}
        <article className="lg:col-span-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Calculator className="w-4 h-4" />
                <span>Ví dụ minh họa từng bước (Worked Example)</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Bài toán mẫu: Lương Gross 50.000.000 ₫/tháng (1 người phụ thuộc)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Giả định chuẩn: Cá nhân cư trú làm việc tại Vùng I (lương tối thiểu vùng {formatCurrency(REGIONAL_MIN_WAGE_2026.I)}),
                đóng bảo hiểm bắt buộc trên toàn bộ lương, chưa tính thêm phụ cấp ăn trưa hay chi phí y tế/giáo dục.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm text-left text-slate-700">
                  <thead className="bg-slate-100 text-xs text-slate-600 uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Bước tính</th>
                      <th className="px-3 py-2.5 text-right">Luật Cũ (7 bậc)</th>
                      <th className="px-3 py-2.5 text-right text-emerald-700 bg-emerald-50/60">Luật Mới 2026 (5 bậc)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-3 py-2.5 font-medium">1. Lương Gross tháng</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(workedExample50M.oldSide.grossIncome)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold bg-emerald-50/20">{formatCurrency(workedExample50M.newSide.grossIncome)}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">
                        2. Bảo hiểm bắt buộc (10,5%)
                        <span className="block text-[11px] text-slate-400">
                          BHXH 8% + BHYT 1,5% (trần 46,8tr) + BHTN 1% (trên 50tr)
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-red-600">- {formatCurrency(workedExample50M.oldSide.insurance)}</td>
                      <td className="px-3 py-2.5 text-right text-red-600 bg-emerald-50/20">- {formatCurrency(workedExample50M.newSide.insurance)}</td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="px-3 py-2.5 font-medium">3. Thu nhập trước thuế (1 - 2)</td>
                      <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(workedExample50M.oldSide.incomeBeforeTax)}</td>
                      <td className="px-3 py-2.5 text-right font-medium bg-emerald-50/20">{formatCurrency(workedExample50M.newSide.incomeBeforeTax)}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">4. Giảm trừ bản thân</td>
                      <td className="px-3 py-2.5 text-right text-red-600">- {formatCurrency(workedExample50M.oldSide.personalDeduction)}</td>
                      <td className="px-3 py-2.5 text-right text-emerald-700 font-medium bg-emerald-50/20">- {formatCurrency(workedExample50M.newSide.personalDeduction)}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">5. Giảm trừ 1 người phụ thuộc</td>
                      <td className="px-3 py-2.5 text-right text-red-600">- {formatCurrency(workedExample50M.oldSide.dependentDeduction)}</td>
                      <td className="px-3 py-2.5 text-right text-emerald-700 font-medium bg-emerald-50/20">- {formatCurrency(workedExample50M.newSide.dependentDeduction)}</td>
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="px-3 py-2.5 font-semibold">6. Thu nhập tính thuế (TNTT)</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(workedExample50M.oldSide.taxableIncome)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900 bg-emerald-50/20">{formatCurrency(workedExample50M.newSide.taxableIncome)}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5">
                        7. Phân bổ theo bậc lũy tiến
                        <span className="block text-[11px] text-slate-400">
                          Cũ (7 bậc): 5tr×5% + 5tr×10% + 8tr×15% + phần trên 18tr×20%
                          <br />
                          Mới (5 bậc): 10tr×5% + phần trên 10tr×10%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-red-600">{formatCurrency(workedExample50M.oldSide.taxAmount)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-700 bg-emerald-50/20">{formatCurrency(workedExample50M.newSide.taxAmount)}</td>
                    </tr>
                    <tr className="bg-emerald-50 font-bold">
                      <td className="px-3 py-3 text-slate-900">8. Lương Thực Lĩnh (NET)</td>
                      <td className="px-3 py-3 text-right text-slate-800">{formatCurrency(workedExample50M.oldSide.netIncome)}</td>
                      <td className="px-3 py-3 text-right text-emerald-700">{formatCurrency(workedExample50M.newSide.netIncome)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <strong>Kết quả tiết kiệm:</strong> Giảm <strong>{formatCurrency(workedExample50M.savingsMonth)}/tháng</strong> tiền thuế (tương đương{' '}
                  <strong>{formatCurrency(workedExample50M.savingsYear)}/năm</strong>, giảm ~{workedExample50M.savingsPct}% số thuế phải nộp).
                </div>
                {onQuickLoadSalary && (
                  <button
                    type="button"
                    onClick={() => onQuickLoadSalary(50_000_000, 1, 'month')}
                    className="shrink-0 inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-md transition-colors cursor-pointer"
                  >
                    <span>Nạp ví dụ 50M này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
            * Lưu ý: Ví dụ trên mang tính chất minh họa chuẩn. Nếu người lao động có thêm tiền ăn trưa (miễn tới 1,2tr/tháng)
            hoặc chi phí y tế, giáo dục (tối đa 47tr/năm), số thuế thực nộp theo luật mới sẽ còn thấp hơn nữa.
          </div>
        </article>

        {/* Benchmark Savings Table across salary levels */}
        <article className="lg:col-span-6 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Bảng tra cứu nhanh mức tiết kiệm thuế 2026</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Tôi tiết kiệm được bao nhiêu thuế trong năm 2026? (Gross-to-Net Benchmark)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                So sánh trực tiếp số thuế TNCN theo quy định cũ (giảm trừ 11tr/4,4tr, 7 bậc) và quy định mới 2026
                (giảm trừ 15,5tr/6,2tr, 5 bậc) tại Vùng I.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs sm:text-sm text-left text-slate-700">
                  <thead className="bg-slate-100 text-xs text-slate-600 uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Mức lương Gross</th>
                      <th className="px-3 py-2.5 text-right">Thuế Cũ</th>
                      <th className="px-3 py-2.5 text-right">Thuế Mới</th>
                      <th className="px-3 py-2.5 text-right text-emerald-700">Tiết kiệm/Năm</th>
                      <th className="px-3 py-2.5 text-right">Lương Net Mới</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {benchmarkRows.map((row) => (
                      <tr
                        key={row.label}
                        className={`hover:bg-slate-50 ${row.highlight ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className={`px-3 py-2.5 ${row.highlight ? 'font-semibold text-blue-900' : 'font-medium'}`}>
                          {row.label}
                        </td>
                        <td className="px-3 py-2.5 text-right text-red-600">
                          {formatCurrency(row.oldTax)}
                        </td>
                        <td className={`px-3 py-2.5 text-right ${row.newTax === 0 ? 'font-bold text-emerald-600' : 'font-semibold'}`}>
                          {formatCurrency(row.newTax)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-700">
                          +{formatCurrency(row.savingsYear)}
                        </td>
                        <td className={`px-3 py-2.5 text-right ${row.highlight ? 'font-bold text-slate-900' : 'font-semibold'}`}>
                          {formatCurrency(row.newNet)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs text-slate-500">
                  Cần xem thêm các trường hợp đặc thù (Freelancer, 2 nguồn thu, OT, Học phí)?
                </span>
                {onNavigateToTab && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('profiles')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Xem 20 Hồ sơ mẫu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateToTab('conversion')}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Đổi Net ⇄ Gross</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
            * Ngưỡng miễn thuế mới: Độc thân không NPT bắt đầu nộp thuế khi thu nhập sau BHXH &gt; 15,5 triệu/tháng (~17,32tr Gross).
            Có 1 NPT bắt đầu nộp thuế khi thu nhập sau BHXH &gt; 21,7 triệu/tháng (~24,25tr Gross).
          </div>
        </article>
      </div>

      {/* 3. Calculation Methodology & Specialized Guides (Foreigners, Monthly vs Annual) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card A: Formula & Methodology */}
        <article className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            1. Công thức chuẩn &amp; Phương pháp tính (Calculation Methodology)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Thuế TNCN từ tiền lương, tiền công của <strong>cá nhân cư trú</strong> ký hợp đồng lao động từ 03 tháng trở lên
            được xác định tuần tự qua 4 bước:
          </p>
          <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside bg-slate-50 p-3.5 rounded-lg border border-slate-100">
            <li>
              <strong>Thu nhập trước thuế</strong> = Tổng thu nhập (Gross) − Bảo hiểm bắt buộc (BHXH {(INSURANCE_RATES.bhxh * 100).toFixed(0)}% + BHYT {(INSURANCE_RATES.bhyt * 100).toFixed(1)}% + BHTN {(INSURANCE_RATES.bhtn * 100).toFixed(0)}%).
            </li>
            <li>
              <strong>Trừ khoản miễn thuế</strong>: Tiền ăn giữa ca (tối đa {formatCurrency(MEAL_ALLOWANCE_CAP_NEW)}/tháng theo NĐ 253, luật cũ {formatCurrency(MEAL_ALLOWANCE_CAP_OLD)}) + 100% tiền lương làm thêm giờ, làm ban đêm (Điều 26 NĐ 253).
            </li>
            <li>
              <strong>Trừ các khoản giảm trừ</strong>: Bản thân ({formatCurrency(NEW_CONFIG.personalDeduction)}/tháng) + Người phụ thuộc ({formatCurrency(NEW_CONFIG.dependentDeduction)}/người/tháng) + Y tế (tối đa {formatCurrency(MEDICAL_DEDUCTION_CAP_YEAR)}/năm) + Giáo dục (tối đa {formatCurrency(EDUCATION_DEDUCTION_CAP_YEAR)}/năm).
            </li>
            <li>
              <strong>Thuế TNCN</strong> = Áp biểu thuế lũy tiến từng phần (5 bậc mới: 5%, 10%, 20%, 30%, 35%) lên phần <em>Thu nhập tính thuế</em>.
            </li>
          </ol>
          <p className="text-[11px] text-slate-500">
            Trần lương đóng BHXH/BHYT bằng 20 lần mức tham chiếu ({formatCurrency(BHXH_MAX_CAP)}/tháng với mức cơ sở {formatCurrency(LUONG_CO_BAN)}).
            Trần đóng BHTN bằng 20 lần lương tối thiểu vùng.
          </p>
        </article>

        {/* Card B: Monthly Withholding vs Annual Finalization */}
        <article className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            2. Khác biệt giữa Tạm khấu trừ tháng &amp; Quyết toán thuế năm
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nhiều người lao động thắc mắc vì sao cuối năm được <strong>hoàn thuế</strong> hoặc phải <strong>nộp thêm</strong>.
            Nguyên nhân đến từ quy tắc quyết toán cả năm:
          </p>
          <ul className="text-xs text-slate-700 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Giảm trừ bản thân đủ 12 tháng (186tr/năm):</strong> Cá nhân cư trú được tính đủ 12 tháng giảm trừ
                bản thân khi quyết toán năm kể cả khi mới đi làm giữa năm hoặc nghỉ việc vài tháng (điểm c.1.1 khoản 1 Điều 9 TT 111/2013/TT-BTC).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Dàn đều thưởng Tết / Lương tháng 13:</strong> Tháng nhận thưởng bị tạm khấu trừ ở bậc thuế cao
                (20%–35%), nhưng khi quyết toán năm được cộng gộp và chia đều cho biểu thuế 12 tháng nên thường được hoàn thuế.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Giảm trừ Y tế (23tr) &amp; Giáo dục (24tr):</strong> Được tổng hợp hóa đơn chứng từ hợp lệ khi
                quyết toán năm, giúp hoàn lại số thuế đã tạm nộp trong năm.
              </span>
            </li>
          </ul>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('annual')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline pt-1 cursor-pointer"
            >
              <span>Mở công cụ Quyết toán thuế năm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </article>

        {/* Card C: Foreign Employees (Expats) & Non-residents */}
        <article className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            3. Thuế TNCN cho Người nước ngoài &amp; Chuyên gia (Foreigners / Expats)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nghĩa vụ thuế của lao động nước ngoài tại Việt Nam phụ thuộc vào <strong>tình trạng cư trú thuế</strong>
            (Tax Residency Status):
          </p>
          <div className="space-y-2.5 text-xs">
            <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-3">
              <div className="font-bold text-purple-900">
                A. Cá nhân cư trú (Tax Resident — có mặt từ 183 ngày/năm trở lên hoặc có nơi ở thường trú)
              </div>
              <p className="text-slate-600 mt-1">
                Áp dụng <strong>biểu thuế lũy tiến 5 bậc (5% – 35%)</strong> trên thu nhập toàn cầu giống công dân Việt Nam.
                Được giảm trừ bản thân 15,5 triệu/tháng và 6,2 triệu/tháng cho mỗi người phụ thuộc. Đóng BHXH (8%) và BHYT (1,5%)
                tối đa trên trần 46,8 triệu/tháng (người nước ngoài không đóng 1% BHTN).
              </p>
            </div>
            <div className="bg-amber-50/60 border border-amber-100 rounded-lg p-3">
              <div className="font-bold text-amber-900">
                B. Cá nhân không cư trú (Non-Resident — dưới 183 ngày/năm)
              </div>
              <p className="text-slate-600 mt-1">
                Chịu thuế suất toàn phần cố định <strong>20% (Flat Tax Rate)</strong> trên tổng thu nhập phát sinh tại Việt Nam,
                không được trừ giảm trừ gia cảnh trước khi tính thuế.
              </p>
            </div>
          </div>
        </article>
      </div>

      {/* 4. Official Legal Basis & Legislation Links */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Căn cứ pháp lý chính thức (Official Legal Basis &amp; Tax Rules)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Mọi hằng số và thuật toán trong công cụ đều bám sát các văn bản quy phạm pháp luật dưới đây.
            </p>
          </div>
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('changelog')}
              className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <span>Xem dòng thời gian Luật 2007 → 2026</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs sm:text-sm text-left text-slate-700">
            <thead className="bg-slate-50 text-xs text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Số hiệu văn bản</th>
                <th className="px-4 py-3">Hiệu lực áp dụng</th>
                <th className="px-4 py-3">Nội dung quy định áp dụng trong máy tính thuế</th>
                <th className="px-4 py-3 text-right">Tra cứu toàn văn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {OFFICIAL_LEGAL_SOURCES.map((doc) => (
                <tr key={doc.code} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 align-top">
                    <div className="font-bold text-slate-900">{doc.code}</div>
                    <div className="text-xs text-slate-500">{doc.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{doc.issuedBy}</div>
                  </td>
                  <td className="px-4 py-3.5 align-top whitespace-nowrap">
                    <span className="inline-block bg-blue-50 text-blue-700 font-medium text-xs px-2.5 py-1 rounded-md border border-blue-100">
                      {doc.effectiveDate}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 align-top text-xs text-slate-600 leading-relaxed max-w-xl">
                    {doc.scope}
                  </td>
                  <td className="px-4 py-3.5 align-top text-right whitespace-nowrap space-y-1.5">
                    <div>
                      <a
                        href={doc.govUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <span>Chính phủ (Văn bản)</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div>
                      <a
                        href={doc.tvplUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 hover:underline"
                      >
                        <span>Thư Viện Pháp Luật</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Visible FAQ Section matching common user & AI search queries */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Câu hỏi thường gặp về Thuế TNCN 2026 (Frequently Asked Questions)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Giải đáp nhanh các thắc mắc phổ biến nhất về mức giảm trừ mới, biểu thuế 5 bậc và Nghị định 253/2026/NĐ-CP.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">
              1. Lương bao nhiêu thì phải đóng thuế TNCN năm 2026?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Theo mức giảm trừ gia cảnh mới từ năm 2026, người độc thân (0 người phụ thuộc) có thu nhập sau khi trừ bảo hiểm
              bắt buộc đến <strong>{formatCurrency(NEW_CONFIG.personalDeduction)}/tháng</strong> (tương đương lương Gross khoảng{' '}
              <strong>17,32 triệu đồng/tháng</strong>, hoặc <strong>18,52 triệu đồng/tháng</strong> nếu có thêm 1,2 triệu tiền ăn
              trưa miễn thuế) sẽ <strong>không phải nộp thuế TNCN</strong>. Với 1 người phụ thuộc, ngưỡng miễn thuế tăng lên{' '}
              <strong>21,7 triệu đồng/tháng</strong> sau bảo hiểm (~24,25 triệu Gross), và lên tới{' '}
              <strong>~28,6 triệu đồng/tháng</strong> nếu hưởng tối đa giảm trừ y tế, giáo dục.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">
              2. Biểu thuế lũy tiến 5 bậc mới khác gì so với biểu 7 bậc cũ?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Luật Thuế TNCN 2025 (109/2025/QH15) rút gọn từ 7 bậc xuống 5 bậc: <strong>Bậc 1 (5%)</strong> cho thu nhập tính
              thuế đến 10 triệu/tháng (cũ là đến 5 triệu); <strong>Bậc 2 (10%)</strong> từ trên 10 đến 30 triệu (gộp bậc 10% và 15%
              cũ); <strong>Bậc 3 (20%)</strong> từ trên 30 đến 60 triệu (gộp bậc 20% và 25% cũ); <strong>Bậc 4 (30%)</strong> từ
              trên 60 đến 100 triệu; và <strong>Bậc 5 (35%)</strong> cho phần thu nhập tính thuế trên 100 triệu đồng/tháng (cũ là
              trên 80 triệu).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">
              3. Tiền lương làm thêm giờ (OT), làm ca đêm và tiền ăn trưa được miễn thuế thế nào?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Từ ngày 01/07/2026 theo Nghị định 253/2026/NĐ-CP: (1) Toàn bộ <strong>tiền lương làm thêm giờ, làm việc ban đêm</strong>{' '}
              được miễn thuế TNCN (Điều 26), thay vì chỉ miễn phần chênh lệch trả cao hơn so với ngày thường như trước đây;
              (2) Phụ cấp <strong>tiền ăn giữa ca, ăn trưa</strong> bằng tiền được miễn thuế tối đa{' '}
              <strong>{formatCurrency(MEAL_ALLOWANCE_CAP_NEW)}/tháng</strong> (tăng từ mức {formatCurrency(MEAL_ALLOWANCE_CAP_OLD)}/tháng).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">
              4. Giảm trừ chi phí y tế (23 triệu) và giáo dục (24 triệu) áp dụng ra sao?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Theo Điều 49 Nghị định 253/2026/NĐ-CP, người nộp thuế được giảm trừ trước khi tính thuế đối với: chi phí khám,
              chữa bệnh trong nước (tối đa <strong>{formatCurrency(MEDICAL_DEDUCTION_CAP_YEAR)}/năm</strong>) và học phí giáo dục -
              đào tạo chính quy trong nước từ mầm non đến đại học cho bản thân hoặc người phụ thuộc (tối đa{' '}
              <strong>{formatCurrency(EDUCATION_DEDUCTION_CAP_YEAR)}/năm</strong>). Tổng cộng lên tới <strong>47 triệu đồng/năm</strong>{' '}
              khi có đầy đủ hóa đơn điện tử hợp pháp.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">
              5. Thu nhập vãng lai (Freelancer, hợp đồng dịch vụ) khấu trừ 10% thay đổi thế nào?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Theo Điều 50 và Điều 51 Nghị định 253/2026/NĐ-CP, ngưỡng chi trả thu nhập vãng lai phải khấu trừ 10% tại nguồn
              được nâng từ 2 triệu đồng lên <strong>{formatCurrency(CASUAL_INCOME_WITHHOLDING_THRESHOLD)}/lần</strong>. Đồng thời,
              cá nhân có thu nhập vãng lai bình quân tháng trong năm không quá{' '}
              <strong>{formatCurrency(CASUAL_INCOME_NO_FINALIZATION_THRESHOLD)}/tháng</strong> và đã khấu trừ 10% thì không bắt
              buộc phải quyết toán thuế lại đối với phần thu nhập này.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900">
              6. Điều kiện thu nhập để đăng ký người phụ thuộc năm 2026 là bao nhiêu?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Theo Thông tư 87/2026/TT-BTC, cá nhân ngoài độ tuổi lao động (cha mẹ, ông bà...) hoặc người không có khả năng
              lao động được đăng ký làm người phụ thuộc nếu có thu nhập bình quân tháng trong năm từ tất cả các nguồn không
              vượt quá <strong>{formatCurrency(DEPENDENT_INCOME_THRESHOLD)}/tháng</strong> (tăng gấp 3 lần so với mức 1 triệu
              đồng/tháng theo Thông tư 111/2013/TT-BTC trước đây).
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Tuyên bố miễn trừ trách nhiệm (Disclaimer):</strong> Công cụ Tính Thuế TNCN 2026 cung cấp kết quả ước tính
            dựa trên quy định pháp luật hiện hành nhằm mục đích tham khảo, lập kế hoạch tài chính cá nhân và đối chiếu lương.
            Kết quả không thay thế tờ khai quyết toán thuế chính thức hoặc ý kiến tư vấn pháp lý chuyên nghiệp.
          </div>
        </div>
      </div>
    </section>
  );
};
