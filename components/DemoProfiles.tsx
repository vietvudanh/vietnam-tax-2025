import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Calculator,
  CalendarRange,
  Users,
  ShieldCheck,
  PiggyBank,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  HeartPulse,
  GraduationCap,
  Moon,
  Gift,
  Search,
} from 'lucide-react';
import {
  calculateComparison,
  calculateAnnualComparison,
  formatCurrency,
  OLD_CONFIG,
  NEW_CONFIG,
} from '../utils/taxCalculator';
import { TaxPeriod, Region } from '../types';
import { DEMO_PROFILES, DemoProfile, IncomeTier } from '../data/demoProfiles';

export interface DemoProfilesProps {
  onApplyProfile: (profile: DemoProfile, targetPeriod: TaxPeriod) => void;
  regionalMinWageMap: Record<Region, number>;
  useNewDeduction: boolean;
}

/** Tỷ lệ phần trăm giảm thuế so với luật cũ */
const calculateSavingsPercent = (oldTax: number, diffTax: number): string => {
  if (oldTax <= 0) return '0%';
  const savings = Math.max(0, -diffTax);
  const pct = Math.round((savings / oldTax) * 100);
  return `${pct}%`;
};

const BADGE_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const DemoProfiles: React.FC<DemoProfilesProps> = ({
  onApplyProfile,
  regionalMinWageMap,
  useNewDeduction,
}) => {
  const [viewPeriod, setViewPeriod] = useState<TaxPeriod>('month');
  const [tierFilter, setTierFilter] = useState<IncomeTier>('all');
  const [dependentsFilter, setDependentsFilter] = useState<'all' | '0' | '1' | '2plus'>('all');
  const [featureFilter, setFeatureFilter] = useState<'all' | 'med_edu' | 'overtime' | 'bonus'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const personalDeduction = useNewDeduction ? NEW_CONFIG.personalDeduction : OLD_CONFIG.personalDeduction;
  const dependentDeduction = useNewDeduction ? NEW_CONFIG.dependentDeduction : OLD_CONFIG.dependentDeduction;

  // Tính toán trước kết quả thuế cho từng hồ sơ theo cả tháng lẫn năm
  // So sánh Luật cũ hiện hành (11tr / 4,4tr) với Luật mới 2025 (15,5tr / 6,2tr)
  const calculatedProfiles = useMemo(() => {
    return DEMO_PROFILES.map((profile) => {
      const minWage = regionalMinWageMap[profile.region];

      const oldMonthly = calculateComparison(
        profile.monthlyGross,
        profile.dependents,
        profile.region,
        profile.customInsuranceSalary,
        OLD_CONFIG.personalDeduction,
        OLD_CONFIG.dependentDeduction,
        minWage,
        profile.extra
      ).oldReg;

      const newMonthly = calculateComparison(
        profile.monthlyGross,
        profile.dependents,
        profile.region,
        profile.customInsuranceSalary,
        NEW_CONFIG.personalDeduction,
        NEW_CONFIG.dependentDeduction,
        minWage,
        profile.extra
      ).newReg;

      const monthlyComparison = {
        oldReg: oldMonthly,
        newReg: newMonthly,
        diffTax: newMonthly.taxAmount - oldMonthly.taxAmount,
        diffNet: newMonthly.netIncome - oldMonthly.netIncome,
      };

      const oldAnnual = calculateAnnualComparison(
        {
          monthlyGross: profile.monthlyGross,
          monthsWorked: profile.monthsWorked,
          bonuses: profile.bonuses,
          dependents: profile.dependents,
          region: profile.region,
          customInsuranceSalary: profile.customInsuranceSalary,
          extra: profile.extra,
        },
        OLD_CONFIG.personalDeduction,
        OLD_CONFIG.dependentDeduction,
        minWage
      ).oldReg;

      const newAnnual = calculateAnnualComparison(
        {
          monthlyGross: profile.monthlyGross,
          monthsWorked: profile.monthsWorked,
          bonuses: profile.bonuses,
          dependents: profile.dependents,
          region: profile.region,
          customInsuranceSalary: profile.customInsuranceSalary,
          extra: profile.extra,
        },
        NEW_CONFIG.personalDeduction,
        NEW_CONFIG.dependentDeduction,
        minWage
      ).newReg;

      const annualComparison = {
        oldReg: oldAnnual,
        newReg: newAnnual,
        diffTax: newAnnual.annual.taxAmount - oldAnnual.annual.taxAmount,
        diffNet: newAnnual.netIncomeYear - oldAnnual.netIncomeYear,
      };

      const currentResult =
        viewPeriod === 'month'
          ? {
              oldTax: monthlyComparison.oldReg.taxAmount,
              newTax: monthlyComparison.newReg.taxAmount,
              oldNet: monthlyComparison.oldReg.netIncome,
              newNet: monthlyComparison.newReg.netIncome,
              diffTax: monthlyComparison.diffTax,
              diffNet: monthlyComparison.diffNet,
              gross: monthlyComparison.newReg.grossIncome,
            }
          : {
              oldTax: annualComparison.oldReg.annual.taxAmount,
              newTax: annualComparison.newReg.annual.taxAmount,
              oldNet: annualComparison.oldReg.netIncomeYear,
              newNet: annualComparison.newReg.netIncomeYear,
              diffTax: annualComparison.diffTax,
              diffNet: annualComparison.diffNet,
              gross: annualComparison.newReg.totalGross,
            };

      const savingsPercent = calculateSavingsPercent(currentResult.oldTax, currentResult.diffTax);

      return {
        profile,
        monthlyComparison,
        annualComparison,
        currentResult,
        savingsPercent,
      };
    });
  }, [viewPeriod, regionalMinWageMap]);

  // Bộ lọc danh sách hồ sơ
  const filteredProfiles = useMemo(() => {
    return calculatedProfiles.filter(({ profile }) => {
      // Lọc theo khung thu nhập
      if (tierFilter !== 'all' && profile.tier !== tierFilter) {
        return false;
      }

      // Lọc theo người phụ thuộc
      if (dependentsFilter === '0' && profile.dependents !== 0) return false;
      if (dependentsFilter === '1' && profile.dependents !== 1) return false;
      if (dependentsFilter === '2plus' && profile.dependents < 2) return false;

      // Lọc theo đặc điểm NĐ 253
      if (
        featureFilter === 'med_edu' &&
        profile.extra.medicalExpensesYear === 0 &&
        profile.extra.educationExpensesYear === 0
      ) {
        return false;
      }
      if (featureFilter === 'overtime' && profile.extra.overtimePay === 0) {
        return false;
      }
      if (featureFilter === 'bonus' && profile.bonuses.length === 0) {
        return false;
      }

      // Tìm kiếm từ khóa
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchTitle = profile.title.toLowerCase().includes(query);
        const matchRole = profile.role.toLowerCase().includes(query);
        const matchDesc = profile.description.toLowerCase().includes(query);
        const matchBadge = profile.badgeLabel.toLowerCase().includes(query);
        if (!matchTitle && !matchRole && !matchDesc && !matchBadge) {
          return false;
        }
      }

      return true;
    });
  }, [calculatedProfiles, tierFilter, dependentsFilter, featureFilter, searchTerm]);

  const periodSuffix = viewPeriod === 'year' ? ' / năm' : ' / tháng';

  return (
    <div className="space-y-8">
      {/* Banner giới thiệu & Thống kê nhanh */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-800/80 px-3 py-1 rounded-full text-xs font-semibold text-blue-200 border border-blue-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Dự liệu thực tế theo Luật Thuế TNCN 2025 & NĐ 253/2026/NĐ-CP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Thư viện Hồ sơ Mẫu Thuế TNCN 2026
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              Khám phá tác động cụ thể của chính sách thuế mới trên 16 hồ sơ điển hình: từ người mới đi làm 
              (<span className="font-semibold text-white">200M/năm</span>), Freelancer tự do (<span className="font-semibold text-white">300M/năm</span>), bác sĩ 2 nguồn thu, kỹ sư chuyên viên (
              <span className="font-semibold text-white">500M/năm</span>), quản lý (
              <span className="font-semibold text-white">1 Tỷ/năm</span>) đến lãnh đạo cấp cao (
              <span className="font-semibold text-white">100M - 150M/tháng</span>).
            </p>
          </div>

          {/* Nút chuyển đổi chế độ xem Tháng / Năm */}
          <div className="bg-blue-950/70 p-1.5 rounded-xl border border-blue-800 shrink-0 self-start lg:self-center">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setViewPeriod('month')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewPeriod === 'month'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                }`}
              >
                <Calculator className="w-4 h-4" />
                Theo tháng
              </button>
              <button
                type="button"
                onClick={() => setViewPeriod('year')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewPeriod === 'year'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
                }`}
              >
                <CalendarRange className="w-4 h-4" />
                Quyết toán năm
              </button>
            </div>
          </div>
        </div>

        {/* 4 Thẻ điểm nhấn chính sách */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-blue-800/80">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <span className="inline-block bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded border border-emerald-500/30 mb-2">
              Giảm 100% thuế
            </span>
            <div className="font-bold text-white text-base">Nhóm ~200M / Năm</div>
            <p className="text-xs text-blue-200 mt-1">
              Lương ~16,7tr/tháng thuế về đúng <strong className="text-emerald-400">0 VNĐ</strong> nhờ mức giảm trừ bản thân 15,5tr + ăn ca 1,2tr.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <span className="inline-block bg-blue-500/20 text-blue-300 text-xs font-bold px-2 py-0.5 rounded border border-blue-500/30 mb-2">
              Tiết kiệm ~20M/năm
            </span>
            <div className="font-bold text-white text-base">Nhóm 500M / Năm</div>
            <p className="text-xs text-blue-200 mt-1">
              Bậc 2 giảm thuế suất từ 15% xuống 10%, kết hợp giảm trừ chi phí học tập & y tế cho con.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <span className="inline-block bg-purple-500/20 text-purple-300 text-xs font-bold px-2 py-0.5 rounded border border-purple-500/30 mb-2">
              Tiết kiệm ~45M/năm
            </span>
            <div className="font-bold text-white text-base">Nhóm 1 Tỷ / Năm</div>
            <p className="text-xs text-blue-200 mt-1">
              Hưởng trọn kịch trần 47M y tế + giáo dục và thuế suất bậc 3 giảm còn 20% (thay vì 25%).
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
            <span className="inline-block bg-amber-500/20 text-amber-300 text-xs font-bold px-2 py-0.5 rounded border border-amber-500/30 mb-2">
              Tiết kiệm &gt; 55M/năm
            </span>
            <div className="font-bold text-white text-base">Nhóm 100M / Tháng</div>
            <p className="text-xs text-blue-200 mt-1">
              Ngưỡng chịu thuế 35% dời từ 80M lên 100M, trần đóng BHXH cố định 46,8M giúp giữ lại nhiều thu nhập hơn.
            </p>
          </div>
        </div>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Bộ lọc hồ sơ</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {filteredProfiles.length} / {DEMO_PROFILES.length} hồ sơ
            </span>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên, chức danh, mức lương..."
              className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          {/* Mức thu nhập */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 sm:w-28 shrink-0">Mức thu nhập:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all' as const, label: 'Tất cả các mức' },
                { id: 'under300m' as const, label: 'Dưới 300 triệu/năm' },
                { id: '300m_600m' as const, label: '300M - 600M/năm (~25-50M/tháng)' },
                { id: '600m_1b' as const, label: '600M - 1 Tỷ/năm (~50-83M/tháng)' },
                { id: 'over1b' as const, label: 'Trên 1 Tỷ/năm (100M+/tháng)' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTierFilter(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    tierFilter === t.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Người phụ thuộc */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 sm:w-28 shrink-0">Người phụ thuộc:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all' as const, label: 'Tất cả' },
                { id: '0' as const, label: '0 người (Độc thân)' },
                { id: '1' as const, label: '1 người phụ thuộc' },
                { id: '2plus' as const, label: '2+ người phụ thuộc' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDependentsFilter(d.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    dependentsFilter === d.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Đặc điểm NĐ 253 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 sm:w-28 shrink-0">Đặc điểm NĐ 253:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all' as const, label: 'Tất cả', icon: null },
                { id: 'med_edu' as const, label: 'Có Y tế / Giáo dục', icon: HeartPulse },
                { id: 'overtime' as const, label: 'Có làm thêm giờ / ca đêm', icon: Moon },
                { id: 'bonus' as const, label: 'Có thưởng Tết / Thưởng năm', icon: Gift },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFeatureFilter(f.id)}
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      featureFilter === f.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lưới các thẻ hồ sơ mẫu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfiles.map(({ profile, currentResult, savingsPercent }) => {
          const isTaxFree = currentResult.newTax === 0;
          const badgeClass = BADGE_COLOR_MAP[profile.badgeVariant] || BADGE_COLOR_MAP.neutral;

          return (
            <div
              key={profile.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                {/* Header thẻ: Avatar, Tiêu đề, Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl p-1 bg-slate-50 rounded-lg border border-slate-100">
                      {profile.avatarEmoji}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {profile.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{profile.role}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${badgeClass}`}>
                    {profile.badgeLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {profile.description}
                </p>

                {/* Các thông số đầu vào chính */}
                <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Lương GROSS:</span>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(viewPeriod === 'month' ? profile.monthlyGross : profile.annualGross)}
                        {periodSuffix}
                      </span>
                      {viewPeriod === 'month' && (
                        <div className="text-[11px] text-slate-400">
                          (~{formatCurrency(profile.annualGross)} / năm)
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Người phụ thuộc:</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {profile.dependents > 0 ? `${profile.dependents} người` : '0 (Độc thân)'}
                    </span>
                  </div>

                  {/* Khoản NĐ 253 áp dụng */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Giảm trừ NĐ 253:</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {profile.extra.medicalExpensesYear > 0 && (
                        <span className="bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded text-[11px] font-medium border border-cyan-100">
                          Y tế: {(profile.extra.medicalExpensesYear / 1_000_000).toFixed(0)}tr
                        </span>
                      )}
                      {profile.extra.educationExpensesYear > 0 && (
                        <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-[11px] font-medium border border-teal-100">
                          GD: {(profile.extra.educationExpensesYear / 1_000_000).toFixed(0)}tr
                        </span>
                      )}
                      {profile.extra.medicalExpensesYear === 0 && profile.extra.educationExpensesYear === 0 && (
                        <span className="text-slate-400">Không</span>
                      )}
                    </div>
                  </div>

                  {profile.extra.overtimePay > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Làm thêm giờ (OT):</span>
                      <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                        {formatCurrency(profile.extra.overtimePay)}/tháng (Miễn 100%)
                      </span>
                    </div>
                  )}

                  {profile.bonuses.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Thưởng Tết / Năm:</span>
                      <span className="font-semibold text-purple-700">
                        +{formatCurrency(profile.bonuses.reduce((s, b) => s + b.amount, 0))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hộp so sánh kết quả Thuế & Lương Thực lĩnh */}
                <div
                  className={`rounded-xl p-3.5 space-y-2.5 border ${
                    isTaxFree ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Thuế luật cũ:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(currentResult.oldTax)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Thuế luật mới 2026:</span>
                    <span className={`font-bold ${isTaxFree ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {formatCurrency(currentResult.newTax)}
                      {isTaxFree && ' (Miễn 100%)'}
                    </span>
                  </div>

                  <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between items-center">
                    <div className="flex items-center gap-1 text-emerald-700 font-bold text-xs">
                      <PiggyBank className="w-4 h-4" />
                      <span>Tiết kiệm:</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-extrabold text-emerald-600">
                        {formatCurrency(currentResult.diffNet)}
                      </span>
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        -{savingsPercent}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500">Lương NET mới:</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(currentResult.newNet)}
                      {periodSuffix}
                    </span>
                  </div>
                </div>

                {/* Danh sách điểm nổi bật */}
                <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                  {profile.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Nút nạp vào bộ tính toán */}
              <button
                type="button"
                onClick={() => {
                  onApplyProfile(profile, viewPeriod);
                  try {
                    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                  } catch {
                    window.scrollTo(0, 0);
                  }
                }}
                className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                Mở trong bộ tính thuế ({viewPeriod === 'month' ? 'theo tháng' : 'quyết toán năm'})
                <ArrowRight className="w-3.5 h-3.5 ml-auto" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bảng tổng hợp đối chiếu tất cả các hồ sơ mẫu */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-lg">
            Bảng đối chiếu tổng hợp tất cả hồ sơ ({viewPeriod === 'month' ? 'Theo Tháng' : 'Cả Năm'})
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Bức tranh toàn cảnh về mức thuế cũ vs mới và số tiền tiết kiệm trên từng phân khúc thu nhập
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Hồ sơ &amp; Chức danh</th>
                <th className="px-4 py-3 text-right">Gross {periodSuffix}</th>
                <th className="px-3 py-3 text-center">NPT</th>
                <th className="px-4 py-3">Giảm trừ NĐ 253</th>
                <th className="px-4 py-3 text-right">Thuế Luật Cũ</th>
                <th className="px-4 py-3 text-right">Thuế Mới 2026</th>
                <th className="px-4 py-3 text-right">Tiết Kiệm</th>
                <th className="px-3 py-3 text-center">% Giảm</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculatedProfiles.map(({ profile, currentResult, savingsPercent }) => (
                <tr key={profile.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{profile.avatarEmoji}</span>
                      <div>
                        <div className="font-semibold text-slate-900">{profile.title}</div>
                        <div className="text-[11px] text-slate-500">{profile.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                    {formatCurrency(currentResult.gross)}
                  </td>
                  <td className="px-3 py-3.5 text-center font-medium">{profile.dependents}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {profile.extra.medicalExpensesYear > 0 && (
                        <span className="bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded text-[11px] border border-cyan-100">
                          Y tế: {(profile.extra.medicalExpensesYear / 1_000_000).toFixed(0)}tr
                        </span>
                      )}
                      {profile.extra.educationExpensesYear > 0 && (
                        <span className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[11px] border border-teal-100">
                          GD: {(profile.extra.educationExpensesYear / 1_000_000).toFixed(0)}tr
                        </span>
                      )}
                      {profile.extra.overtimePay > 0 && (
                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[11px] border border-amber-100">
                          OT: {(profile.extra.overtimePay / 1_000_000).toFixed(0)}tr
                        </span>
                      )}
                      {profile.extra.medicalExpensesYear === 0 &&
                        profile.extra.educationExpensesYear === 0 &&
                        profile.extra.overtimePay === 0 && (
                          <span className="text-slate-400">Cơ bản</span>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-red-600">
                    {formatCurrency(currentResult.oldTax)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold">
                    <span
                      className={
                        currentResult.newTax === 0 ? 'text-emerald-600 font-extrabold' : 'text-slate-900'
                      }
                    >
                      {formatCurrency(currentResult.newTax)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-600">
                    +{formatCurrency(currentResult.diffNet)}
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        currentResult.newTax === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      -{savingsPercent}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        onApplyProfile(profile, viewPeriod);
                        try {
                          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                        } catch {
                          window.scrollTo(0, 0);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      <span>Tính thử</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Khối phân tích chuyên sâu 3 điểm cốt lõi */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-lg">3 Điểm cốt lõi rút ra từ các hồ sơ mẫu</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="font-bold text-emerald-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center text-xs">
                1
              </span>
              Người thu nhập phổ thông giảm thuế mạnh nhất
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Với mức lương dưới 20 triệu/tháng (200M - 250M/năm), mức thuế TNCN giảm từ 60% đến 100%. Đa số
              người lao động trẻ hoặc có 1 người phụ thuộc không còn phải đóng thuế TNCN.
            </p>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
            <div className="font-bold text-blue-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full inline-flex items-center justify-center text-xs">
                2
              </span>
              Khuyến khích tăng ca và đầu tư học tập, y tế
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Nghị định 253/2026/NĐ-CP miễn thuế 100% tiền làm thêm giờ (OT) và cho phép giảm trừ tới 47 triệu/năm
              cho chi phí y tế &amp; giáo dục. Các hồ sơ có chi phí học tập và tăng ca được hưởng mức giảm thuế vượt trội.
            </p>
          </div>

          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-2">
            <div className="font-bold text-purple-900 text-sm flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-600 text-white rounded-full inline-flex items-center justify-center text-xs">
                3
              </span>
              Tầng lớp trung lưu &amp; chuyên gia giữ lại nhiều hơn
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">
              Ở dải thu nhập 500M - 1,2 Tỷ/năm, thuế suất bậc 2 &amp; 3 giảm 5%, cùng việc kéo giãn khoảng cách giữa các
              bậc giúp mỗi gia đình tiết kiệm từ 20 đến 55+ triệu đồng/năm để chi tiêu và tích lũy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
