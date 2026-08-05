import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/taxCalculator';
import { AnnualTaxResult, MonthlyLine } from '../types';

interface MonthlyBreakdownTableProps {
  data: AnnualTaxResult;
  /** Nhãn bộ quy định đang hiển thị, ví dụ "Quy định mới" */
  label: string;
}

/**
 * Hệ số so với trung vị để coi một tháng là "tháng bị khấu trừ cao bất thường".
 * Tháng có thưởng Tết bị đẩy lên bậc thuế cao chính là nguyên nhân của số thuế
 * được hoàn khi quyết toán năm.
 */
const SPIKE_MEDIAN_FACTOR = 1.5;

/** Trung vị của một mảng số (không sắp xếp tại chỗ, so sánh theo số học). */
const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a: number, b: number): number => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const MonthlyBreakdownTable: React.FC<MonthlyBreakdownTableProps> = ({ data, label }) => {
  const { spikeThreshold, maxWithheld } = useMemo((): { spikeThreshold: number; maxWithheld: number } => {
    const withheldValues: number[] = data.months.map((m: MonthlyLine): number => m.withheldTax);
    const nonZero: number[] = withheldValues.filter((v: number): boolean => v > 0);
    // Không có tháng nào bị khấu trừ -> không đánh dấu, không vẽ thanh (tránh chia cho 0).
    if (nonZero.length === 0) return { spikeThreshold: Number.POSITIVE_INFINITY, maxWithheld: 0 };
    return {
      spikeThreshold: median(nonZero) * SPIKE_MEDIAN_FACTOR,
      maxWithheld: Math.max(...nonZero),
    };
  }, [data.months]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-800">Chi tiết 12 tháng - {label}</h3>
        <p className="text-sm text-slate-500 mt-1">
          Đây là số thuế tạm khấu trừ hằng tháng theo biểu thuế tháng; khi quyết toán năm, tổng số đã
          tạm khấu trừ được so với số thuế phải nộp cả năm để ra số hoàn thuế hoặc nộp thêm.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-slate-700">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 w-16">Tháng</th>
              <th className="px-4 py-3 text-right">Lương</th>
              <th className="px-4 py-3 text-right">Thưởng</th>
              <th className="px-4 py-3 text-right">Bảo hiểm</th>
              <th className="px-4 py-3 text-right">Thuế tạm khấu trừ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.months.map((m: MonthlyLine) => {
              const isEmpty: boolean = m.gross === 0;
              const isSpike: boolean = m.withheldTax > spikeThreshold;
              const barWidth: number = maxWithheld > 0 ? (m.withheldTax / maxWithheld) * 100 : 0;

              const rowClass: string = isSpike
                ? 'bg-amber-50 hover:bg-amber-100/70 transition-colors'
                : 'hover:bg-slate-50 transition-colors';
              const cellClass: string = isEmpty ? 'text-slate-300' : '';

              return (
                <tr key={m.month} className={rowClass}>
                  <th
                    className={`px-4 py-3 font-semibold whitespace-nowrap ${
                      isEmpty ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      T{m.month}
                      {isSpike && (
                        <AlertTriangle
                          className="w-3.5 h-3.5 text-amber-500"
                          aria-label="Tháng bị tạm khấu trừ cao bất thường"
                        />
                      )}
                    </span>
                  </th>
                  <td className={`px-4 py-3 text-right whitespace-nowrap ${cellClass}`}>
                    {formatCurrency(m.salary)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right whitespace-nowrap ${
                      isEmpty ? 'text-slate-300' : m.bonus > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(m.bonus)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right whitespace-nowrap ${
                      isEmpty ? 'text-slate-300' : 'text-red-500'
                    }`}
                  >
                    {formatCurrency(m.insurance)}
                  </td>
                  <td className={`px-4 py-3 text-right whitespace-nowrap ${cellClass}`}>
                    <span className={isEmpty ? '' : isSpike ? 'font-bold text-amber-700' : 'text-slate-700'}>
                      {formatCurrency(m.withheldTax)}
                    </span>
                    {/* Thanh tỉ lệ so với tháng bị khấu trừ cao nhất - giúp nhìn ra tháng đột biến
                        mà không cần biểu đồ. Khi mọi tháng bằng nhau, các thanh dài bằng nhau. */}
                    {maxWithheld > 0 && !isEmpty && (
                      <span className="mt-1 block h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                        <span
                          className={`block h-full rounded-full ${isSpike ? 'bg-amber-400' : 'bg-slate-300'}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            {/* Số liệu lấy thẳng từ kết quả quyết toán, không cộng lại trong component. */}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
              <th className="px-4 py-3 text-left whitespace-nowrap">Tổng</th>
              <td className="px-4 py-3 text-right whitespace-nowrap" colSpan={2}>
                {formatCurrency(data.totalGross)}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap text-red-600">
                {formatCurrency(data.totalInsurance)}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap text-red-600">
                {formatCurrency(data.totalWithheld)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
