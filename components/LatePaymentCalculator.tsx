import React, { useMemo, useState } from 'react';
import { AlertCircle, CalendarDays } from 'lucide-react';
import {
  calculateLatePayment,
  formatDotNumber,
  formatPercentPerDay,
  formatVietnamDate,
  LatePaymentKind,
  parseVietnamDate,
} from '../utils/latePaymentCalculator';

const parseAmount = (value: string): number => parseFloat(value.replace(/[^0-9]/g, '')) || 0;

export const LatePaymentCalculator: React.FC = () => {
  const [amountStr, setAmountStr] = useState<string>('2.000.000.000');
  const [fromDateStr, setFromDateStr] = useState<string>('20/1/2020');
  const [toDateStr, setToDateStr] = useState<string>('20/7/2026');
  const [kind, setKind] = useState<LatePaymentKind>('tax');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const amount = parseAmount(amountStr);
  const fromDate = parseVietnamDate(fromDateStr);
  const toDate = parseVietnamDate(toDateStr);

  const validationError = useMemo(() => {
    if (!fromDate || !toDate) return 'Ngày không hợp lệ. Vui lòng nhập theo định dạng dd/mm/yyyy.';
    if (toDate <= fromDate) return 'Ngày "Đến ngày" phải lớn hơn "Tính từ ngày".';
    if (amount <= 0) return 'Số tiền tính chậm nộp phải lớn hơn 0.';
    return null;
  }, [fromDate, toDate, amount]);

  const result = useMemo(() => {
    if (!fromDate || !toDate || amount <= 0) return null;
    return calculateLatePayment(amount, fromDate, toDate, kind);
  }, [amount, fromDate, toDate, kind]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(cleaned === '' ? '' : (parseInt(cleaned, 10) || 0).toLocaleString('vi-VN').replace(/,/g, '.'));
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 flex gap-2">
        <CalendarDays className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p>
          Tính tiền chậm nộp theo từng giai đoạn pháp lý. Cách đếm ngày theo công thức thực tế:
          <strong> từ ngày (bao gồm) đến ngày (không bao gồm)</strong>.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Số tiền tính chậm nộp</label>
            <input
              type="text"
              value={amountStr}
              onChange={handleAmountChange}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tính từ ngày</label>
            <input
              type="text"
              value={fromDateStr}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDateStr(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800"
              placeholder="dd/mm/yyyy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Đến ngày</label>
            <input
              type="text"
              value={toDateStr}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDateStr(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-800"
              placeholder="dd/mm/yyyy"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-slate-800">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={kind === 'tax'}
              onChange={() => setKind('tax')}
              className="w-4 h-4 text-blue-600 border-slate-300"
            />
            Tính chậm nộp tiền thuế
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={kind === 'administrativeFine'}
              onChange={() => setKind('administrativeFine')}
              className="w-4 h-4 text-blue-600 border-slate-300"
            />
            Tính chậm nộp vi phạm hành chính (chậm nộp tiền phạt)
          </label>
        </div>

        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Thực hiện
        </button>

        {submitted && validationError && (
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {validationError}
          </div>
        )}
      </div>

      {submitted && !validationError && result && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-slate-700">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Chi tiết</th>
                  <th className="px-4 py-3 font-semibold">Diễn giải</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.segments.map((segment, index) => {
                  const displayEnd = index === result.segments.length - 1
                    ? segment.endDate
                    : new Date(segment.endDate.getTime() - 24 * 60 * 60 * 1000);
                  return (
                    <tr key={`${segment.startDate.toISOString()}-${segment.endDate.toISOString()}`}>
                      <td className="px-4 py-3">
                        {formatVietnamDate(segment.startDate)}-{formatVietnamDate(displayEnd)}:{formatDotNumber(amount)}x{segment.days}x{formatPercentPerDay(segment.ratePerDay)} = {formatDotNumber(segment.amount)}
                      </td>
                      <td className="px-4 py-3">{segment.explanation}</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50 font-semibold">
                  <td className="px-4 py-3">TỔNG TIỀN CHẬM NỘP: {formatDotNumber(result.totalAmount)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

