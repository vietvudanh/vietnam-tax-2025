import React from 'react';
import { TrendingDown, TrendingUp, Info, Wallet, Receipt } from 'lucide-react';
import { AnnualComparisonResult, AnnualTaxResult } from '../types';
import { formatCurrency } from '../utils/taxCalculator';

interface AnnualSummaryProps {
  data: AnnualComparisonResult;
}

/**
 * Số tiền quyết toán được tính bằng số thực (đồng), phép cộng dồn 12 tháng để lại
 * sai số dấu phẩy động cỡ 1e-8. So sánh với 0 tuyệt đối sẽ không bao giờ đúng,
 * nên mọi so sánh "bằng nhau" đều dùng ngưỡng 1 đồng.
 */
const EPSILON = 1;

type SettlementKind = 'refund' | 'due' | 'even';

const getSettlementKind = (settlement: number): SettlementKind => {
  if (settlement < -EPSILON) return 'refund';
  if (settlement > EPSILON) return 'due';
  return 'even';
};

interface SettlementTheme {
  heading: string;
  card: string;
  accent: string;
  chip: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SETTLEMENT_THEME: Record<SettlementKind, SettlementTheme> = {
  refund: {
    heading: 'ĐƯỢC HOÀN THUẾ',
    card: 'bg-emerald-50 border-emerald-200',
    accent: 'text-emerald-700',
    chip: 'bg-emerald-100 text-emerald-800',
    icon: TrendingDown,
  },
  due: {
    heading: 'PHẢI NỘP THÊM',
    card: 'bg-amber-50 border-amber-200',
    accent: 'text-amber-700',
    chip: 'bg-amber-100 text-amber-800',
    icon: TrendingUp,
  },
  even: {
    heading: 'VỪA ĐỦ, KHÔNG PHẢI QUYẾT TOÁN THÊM',
    card: 'bg-slate-50 border-slate-200',
    accent: 'text-slate-700',
    chip: 'bg-slate-200 text-slate-700',
    icon: Wallet,
  },
};

/**
 * Vì sao số quyết toán lệch số đã tạm khấu trừ. Chỉ nêu lý do THỰC SỰ xảy ra với
 * dữ liệu đang xem - một câu giải thích sai còn tệ hơn là không giải thích.
 */
const buildReasons = (reg: AnnualTaxResult, kind: SettlementKind): string[] => {
  if (kind === 'even') {
    return [
      'Thu nhập trải đều cả năm và không có khoản giảm trừ nào chỉ được tính khi quyết toán, ' +
        'nên số thuế tạm khấu trừ hằng tháng đã khớp đúng với số thuế quyết toán năm.',
    ];
  }

  const reasons: string[] = [];

  if (reg.months.some((m) => m.bonus > 0)) {
    reasons.push(
      'Khoản thưởng một lần (thưởng Tết, lương tháng 13...) bị tạm khấu trừ theo bậc thuế cao của ' +
        'riêng tháng chi trả. Khi quyết toán, khoản này được trải trên biểu thuế của cả năm nên rơi ' +
        'vào bậc thuế thấp hơn.'
    );
  }

  if (reg.annual.specialDeduction > 0) {
    reasons.push(
      'Chi phí khám chữa bệnh và chi phí giáo dục - đào tạo chỉ được giảm trừ khi quyết toán năm, ' +
        'doanh nghiệp không trừ khi tạm khấu trừ hằng tháng.'
    );
  }

  if (reg.months.some((m) => m.salary === 0)) {
    reasons.push(
      'Bạn không có thu nhập đủ 12 tháng, nhưng khi quyết toán vẫn được giảm trừ bản thân đủ 12 ' +
        'tháng (điểm c.1.1 khoản 1 Điều 9 Thông tư 111/2013/TT-BTC).'
    );
  }

  if (reasons.length === 0) {
    reasons.push(
      'Thuế tạm khấu trừ hằng tháng tính trên thu nhập của từng tháng riêng lẻ, còn quyết toán năm ' +
        'gộp cả năm rồi áp biểu thuế năm - hai cách tính lệch nhau khi thu nhập hoặc các khoản giảm ' +
        'trừ không rải đều qua 12 tháng.'
    );
  }

  return reasons;
};

type RowTone = 'plain' | 'deduction' | 'subtotal' | 'total';

interface SummaryRow {
  label: string;
  note?: string;
  oldValue: number;
  newValue: number;
  /** Chênh lệch lấy thẳng từ kết quả tính toán thay vì tự trừ lại (thuế & thực nhận). */
  diff?: number;
  tone: RowTone;
  /** Hướng có lợi cho người nộp thuế, dùng để tô màu cột chênh lệch. */
  favorable?: 'higher' | 'lower';
  hidden?: boolean;
  /** Chữ thay cho "- 0 ₫" ở cột quy định cũ khi khoản này chỉ có ở quy định mới. */
  oldNotApplicableLabel?: string;
}

const TONE_ROW_CLASS: Record<RowTone, string> = {
  plain: '',
  deduction: '',
  subtotal: 'bg-slate-50',
  total: 'bg-emerald-50',
};

const TONE_VALUE_CLASS: Record<RowTone, string> = {
  plain: '',
  deduction: 'text-red-500',
  subtotal: 'font-semibold',
  total: 'font-bold text-emerald-700',
};

export const AnnualSummary: React.FC<AnnualSummaryProps> = ({ data }) => {
  const { oldReg, newReg } = data;
  const kind = getSettlementKind(newReg.settlement);
  const theme = SETTLEMENT_THEME[kind];
  const SettlementIcon = theme.icon;
  const reasons = buildReasons(newReg, kind);

  const rows: SummaryRow[] = [
    {
      label: 'Tổng thu nhập năm',
      note: 'Lương 12 tháng + thưởng',
      oldValue: oldReg.annual.grossIncome,
      newValue: newReg.annual.grossIncome,
      tone: 'plain',
    },
    {
      label: 'Bảo hiểm xã hội (8%)',
      oldValue: oldReg.annual.insuranceDetails.social,
      newValue: newReg.annual.insuranceDetails.social,
      tone: 'deduction',
    },
    {
      label: 'Bảo hiểm y tế (1,5%)',
      oldValue: oldReg.annual.insuranceDetails.health,
      newValue: newReg.annual.insuranceDetails.health,
      tone: 'deduction',
    },
    {
      label: 'Bảo hiểm thất nghiệp (1%)',
      oldValue: oldReg.annual.insuranceDetails.unemployment,
      newValue: newReg.annual.insuranceDetails.unemployment,
      tone: 'deduction',
    },
    {
      label: 'Thu nhập trước thuế',
      oldValue: oldReg.annual.incomeBeforeTax,
      newValue: newReg.annual.incomeBeforeTax,
      tone: 'subtotal',
    },
    {
      label: 'Thu nhập miễn thuế',
      note: 'Ăn giữa ca (trong hạn mức) + làm thêm giờ, ban đêm',
      oldValue: oldReg.annual.exemptIncome,
      newValue: newReg.annual.exemptIncome,
      tone: 'deduction',
      favorable: 'higher',
      hidden: oldReg.annual.exemptIncome <= 0 && newReg.annual.exemptIncome <= 0,
    },
    {
      label: 'Giảm trừ bản thân (cả năm)',
      note: 'Đủ 12 tháng kể cả khi không làm việc trọn năm',
      oldValue: oldReg.annual.personalDeduction,
      newValue: newReg.annual.personalDeduction,
      tone: 'deduction',
      favorable: 'higher',
    },
    {
      label: 'Giảm trừ người phụ thuộc',
      oldValue: oldReg.annual.dependentDeduction,
      newValue: newReg.annual.dependentDeduction,
      tone: 'deduction',
      favorable: 'higher',
    },
    {
      label: 'Giảm trừ chi phí y tế / giáo dục',
      note: 'Chỉ được tính khi quyết toán năm, tối đa 47tr/năm',
      oldValue: oldReg.annual.specialDeduction,
      newValue: newReg.annual.specialDeduction,
      tone: 'deduction',
      favorable: 'higher',
      hidden: oldReg.annual.specialDeduction <= 0 && newReg.annual.specialDeduction <= 0,
      oldNotApplicableLabel: 'Không áp dụng',
    },
    {
      label: 'Thu nhập tính thuế',
      oldValue: oldReg.annual.taxableIncome,
      newValue: newReg.annual.taxableIncome,
      tone: 'subtotal',
    },
    {
      label: 'Thuế TNCN cả năm',
      note: 'Số thuế quyết toán, chưa trừ phần đã tạm khấu trừ',
      oldValue: oldReg.annual.taxAmount,
      newValue: newReg.annual.taxAmount,
      diff: data.diffTax,
      tone: 'deduction',
      favorable: 'lower',
    },
    {
      label: 'Thực nhận cả năm',
      oldValue: oldReg.netIncomeYear,
      newValue: newReg.netIncomeYear,
      diff: data.diffNet,
      tone: 'total',
      favorable: 'higher',
    },
  ];

  const visibleRows = rows.filter((r) => !r.hidden);

  const renderAmount = (value: number, tone: RowTone): string =>
    tone === 'deduction' ? `- ${formatCurrency(value)}` : formatCurrency(value);

  const renderDiffCell = (row: SummaryRow): React.ReactNode => {
    const diff = row.diff !== undefined ? row.diff : row.newValue - row.oldValue;
    if (Math.abs(diff) < EPSILON) {
      return <span className="text-slate-300">—</span>;
    }
    let color = 'text-slate-700';
    if (row.favorable === 'higher') color = diff > 0 ? 'text-emerald-600' : 'text-amber-600';
    if (row.favorable === 'lower') color = diff < 0 ? 'text-emerald-600' : 'text-amber-600';
    // formatCurrency đã tự in dấu trừ cho số âm - không thêm tiền tố "-" ở đây.
    return <span className={`font-semibold ${color}`}>{formatCurrency(diff)}</span>;
  };

  return (
    <div className="space-y-6">
      {/* 1. Thẻ quyết toán - trọng tâm của chế độ xem theo năm */}
      <div className={`rounded-xl shadow-sm border p-6 ${theme.card}`}>
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-bold text-slate-800">Quyết toán thuế TNCN cả năm</h3>
          <span className="ml-auto text-xs font-bold px-2 py-1 rounded-md bg-green-500 text-white">
            MỚI (SAU 1/7/2026)
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-slate-600">Thuế TNCN cả năm (quyết toán)</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {formatCurrency(newReg.annual.taxAmount)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-slate-600">Đã tạm khấu trừ 12 tháng</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {formatCurrency(newReg.totalWithheld)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-300/60 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div className={`flex items-center gap-2 font-bold ${theme.accent}`}>
            <SettlementIcon className="w-5 h-5" />
            <span className="text-sm sm:text-base">{theme.heading}</span>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${theme.accent}`}>
            {formatCurrency(Math.abs(newReg.settlement))}
          </div>
        </div>

        <div className="mt-4 bg-white/70 border border-slate-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm text-slate-600">
              {reasons.map((reason: string, idx: number) => (
                <p key={idx}>{reason}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bảng diễn giải cả năm, cùng bộ dòng với bảng theo tháng ở chế độ xem tháng */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Diễn giải chi tiết cả năm (VNĐ)</h3>
          <p className="text-sm text-slate-500 mt-1">
            Toàn bộ số liệu là tổng của 12 tháng, tính theo biểu thuế và mức giảm trừ của kỳ năm
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-slate-700">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">Khoản mục</th>
                <th className="px-4 py-3 text-right">QUY ĐỊNH CŨ</th>
                <th className="px-4 py-3 text-right">QUY ĐỊNH MỚI</th>
                <th className="px-4 py-3 text-right">CHÊNH LỆCH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleRows.map((row: SummaryRow) => (
                <tr key={row.label} className={TONE_ROW_CLASS[row.tone]}>
                  <th className="px-4 py-3 font-semibold">
                    {row.label}
                    {row.note && (
                      <span className="block text-xs font-normal text-slate-400">{row.note}</span>
                    )}
                  </th>
                  {row.oldNotApplicableLabel && row.oldValue <= 0 ? (
                    <td className="px-4 py-3 text-right whitespace-nowrap text-slate-400">
                      {row.oldNotApplicableLabel}
                    </td>
                  ) : (
                    <td className={`px-4 py-3 text-right whitespace-nowrap ${TONE_VALUE_CLASS[row.tone]}`}>
                      {renderAmount(row.oldValue, row.tone)}
                    </td>
                  )}
                  <td className={`px-4 py-3 text-right whitespace-nowrap ${TONE_VALUE_CLASS[row.tone]}`}>
                    {renderAmount(row.newValue, row.tone)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{renderDiffCell(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
          Cột chênh lệch = quy định mới − quy định cũ. Dấu “—” nghĩa là hai quy định cho cùng một con số.
        </p>
      </div>

      {/* 3. So sánh nhanh số quyết toán giữa hai quy định */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h4 className="text-sm font-bold text-slate-800 mb-3">
          Số phải quyết toán theo từng quy định
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            { label: 'Quy định cũ', reg: oldReg },
            { label: 'Quy định mới', reg: newReg },
          ] as { label: string; reg: AnnualTaxResult }[]).map(({ label, reg }) => {
            const regKind = getSettlementKind(reg.settlement);
            const regTheme = SETTLEMENT_THEME[regKind];
            return (
              <div key={label} className="border border-slate-200 rounded-lg p-4">
                <div className="text-xs text-slate-500 mb-2">{label}</div>
                <div className={`text-lg font-bold tabular-nums ${regTheme.accent}`}>
                  {formatCurrency(Math.abs(reg.settlement))}
                </div>
                <span
                  className={`inline-block mt-2 text-xs font-semibold px-2 py-1 rounded ${regTheme.chip}`}
                >
                  {regTheme.heading}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
